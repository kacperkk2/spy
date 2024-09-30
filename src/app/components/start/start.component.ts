import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CONFIG } from 'src/app/app.properties';
import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import { CodecService } from 'src/app/services/codec/codec.service';
import { ExportDialog, ExportDialogInput } from 'src/app/export-dialog/export-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  startForm: FormGroup;
  allCategories = CONFIG.CATEGORIES;
  categoriesTitles: string[]; 
  appRoot = CONFIG.URL_ROOT; 
  gamePath = '/game'; 

  get categoriesFormControl() {
    return this.startForm.controls["categories"] as FormControl;
  }

  get categoriesRandomFormControl() {
    return this.startForm.controls["categoriesRandom"] as FormControl;
  }

  get spiesFormControl() {
    return this.startForm.controls["spies"] as FormControl;
  }

  get spiesRandomFormControl() {
    return this.startForm.controls["spiesRandom"] as FormControl;
  }

  get playersFormControl() {
    return this.startForm.controls["players"] as FormControl;
  }

  get showCategoryFormControl() {
    return this.startForm.controls["showCategory"] as FormControl;
  }

  get linksFormControl() {
    return this.startForm.controls["links"] as FormControl;
  }

  constructor(
    private storageManager: StorageManagerService,
    private codec: CodecService,
    private router: Router,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.categoriesTitles = this.allCategories.map(i => i.name)
    this.startForm = new FormGroup({
      players: new FormControl(3, [Validators.required]),
      spies: new FormControl(1, [Validators.required]),
      spiesRandom: new FormControl(false),
      categories: new FormControl([], [Validators.required]),
      categoriesRandom: new FormControl(false),
      showCategory: new FormControl(false),
      links: new FormControl(3, [Validators.required]),
    });
    this.checkedRandomSpies();
    this.checkedRandomCategory();
    const storageForm = this.storageManager.getForm();
    if (storageForm != null) {
      this.startForm.patchValue(storageForm);
    }
  }

  generateClicked() {
    this.storageManager.saveForm(this.startForm.value);
    const links = this.getLinks(Number(this.linksFormControl.value))

    const data = new ExportDialogInput(links);
    const dialogRef = this.dialog.open(ExportDialog, {data: data, width: '90%', maxWidth: '650px', autoFocus: false});
    dialogRef.afterClosed().subscribe();
  }

  getLinks(numberOfLinks: number): string [] {
    const links: string[] = [];
    Array.from(Array(numberOfLinks)).forEach((_, i) => {
      links.push((i+1) + ". \n" + this.getLink());
    });
    return links;
  }

  getLink() {
    const category = this.getCategory(this.categoriesFormControl.value, this.categoriesRandomFormControl.value)
    const settings: Settings = {
      phrase: getRandom(category.values),
      category: this.showCategoryFormControl.value ? category.name : null,
      spies: this.getSpies(this.spiesFormControl.value, this.spiesRandomFormControl.value, this.playersFormControl.value),
      starts: randomPlayer(this.playersFormControl.value)
    }
    const compressed = this.codec.compress(settings)
    const url = location.origin + this.appRoot + this.gamePath + "/" + compressed;
    return url
  }

  getCategoryByName(name: string) {
    return this.allCategories.filter(i => i.name == name)
  }

  getCategory(categories: string[], categoriesRandom: boolean) {
    if (categoriesRandom) {
      const category = getRandom(this.allCategories);
      return category
    }
    
    const categoriesToPick = this.allCategories.filter(i => categories.includes(i.name));
    const category = getRandom(categoriesToPick)
    return category
  }

  getSpies(spies: number, spiesRandom: boolean, players: number) {
    let spiesNumber = spies; 
    if (spiesRandom) {
      spiesNumber = randomNumberWithDistribution(players)
    }
    const allPlayersIds = Array.from({length: players}, (_, i) => i + 1)
    const shuffledPlayers = allPlayersIds.sort(() => 0.5 - Math.random());
    return shuffledPlayers.slice(0, spiesNumber);
  }

  back() {
    this.router.navigate(['/']);
  }

  checkedRandomSpies() {
    this.spiesRandomFormControl.valueChanges.subscribe(val => {
      if (this.spiesRandomFormControl.value == true) {
        this.spiesFormControl.clearValidators();
        this.spiesFormControl.disable();
      } else {
        this.spiesFormControl.setValidators([Validators.required]);
        this.spiesFormControl.enable();
      }
      this.spiesFormControl.updateValueAndValidity();
    });
  }

  checkedRandomCategory() {
    this.categoriesRandomFormControl.valueChanges.subscribe(val => {
      if (this.categoriesRandomFormControl.value == true) {
        this.categoriesFormControl.clearValidators();
      } else {
        this.categoriesFormControl.setValidators([Validators.required]);
      }
      this.categoriesFormControl.updateValueAndValidity();
    });
  }

  restrictCharacters(event: KeyboardEvent) {
    const invalidChars = ['+', '-'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  checkSpies() {
    if (this.spiesFormControl.value == null) {
      this.spiesFormControl.setErrors({'incorrect': true});
      return;
    }

    const spies = Number(this.spiesFormControl.value)
    const players = Number(this.playersFormControl.value)
    if (spies > players) {
      this.spiesFormControl.setErrors({'incorrect': true});
    }
    else {
      this.spiesFormControl.setErrors(null);
    }
  }
}

export interface Settings {
  phrase: string,
  category: string | null,
  spies: number[],
  starts: number
}

function getRandom(data: any) {
  return data[Math.floor(Math.random() * data.length)]
}

function randomPlayer(max: number) {
  return Math.floor(Math.random() * max) + 1
}

function randomNumberWithDistribution(max: number) {
  const random = Math.floor(Math.random() * (100 + 1));
  const defaultChance = CONFIG.DISTIBUTION.DEFAULT
  const specialChance = (100 - (max * 5)) / CONFIG.DISTIBUTION.SPECIAL.length;


  let i = 0;
  let finalNum = 0;
  while (i <= 100) {
    if (CONFIG.DISTIBUTION.SPECIAL.includes(finalNum)) {
      i += specialChance;
    }
    else {
      i += defaultChance;
    }
    
    if (random <= i) {
      return finalNum;
    }
    finalNum++
  }
  return max;
}
