import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CONFIG } from 'src/app/app.properties';
import { Location } from '@angular/common';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit {

  allCategories = CONFIG.CATEGORIES;
  categoriesTitles: string[]; 
  questionsForm: FormGroup;
  question: string = '';
  questionType: 'yesNo' | 'open' = 'yesNo';

  get categoriesFormControl() {
    return this.questionsForm.controls["categories"] as FormControl;
  }

  constructor(
      private route: ActivatedRoute,
      private router: Router, 
      private location: Location) { }

  ngOnInit(): void {
    this.categoriesTitles = this.allCategories.map(i => i.name)
    this.questionsForm = new FormGroup({
      categories: new FormControl([], [Validators.required]),
    });

    this.route.params.subscribe(params => {
      const data = params['data'];
      // parametr spoza listy kategorii (np. stare „null”) ignorujemy
      if (data && this.categoriesTitles.includes(data)) {
        this.categoriesFormControl.setValue([data as string])
        this.next()
      }
    });
  }

  next() {
    const selectedCategories: string[] = this.categoriesFormControl.value
    const questions = this.allCategories
      .filter(category => selectedCategories.includes(category.name))
      .flatMap(category => {
        if (this.questionType == 'yesNo') {
          return category.questionsYesNo;
        }
        else {
          return category.questionsOpen;
        }
      })

    this.question = questions.length ? this.getRandom(questions) : ''
  }

  get hasCategories(): boolean {
    return (this.categoriesFormControl.value ?? []).length > 0;
  }

  getRandom(data: any) {
    return data[Math.floor(Math.random() * data.length)]
  }

  back() {
    this.location.back();
  }
}
