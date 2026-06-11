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

  get oneDeviceControl() {
    return this.startForm.controls["oneDevice"] as FormControl;
  }

  get oneSpyChance() {
    return this.startForm.controls["oneSpyChance"] as FormControl;
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
      oneSpyChance: new FormControl(30, [Validators.required]),
      categories: new FormControl([], [Validators.required]),
      categoriesRandom: new FormControl(false),
      showCategory: new FormControl(false),
      links: new FormControl(3, [Validators.required]),
      oneDevice: new FormControl(false),
    });
    this.checkedRandomSpies();
    this.checkedRandomCategory();
    this.checkedOneDevice();
    const storageForm = this.storageManager.getForm();
    if (storageForm != null) {
      this.startForm.patchValue(storageForm);
    }
  }

  generateClicked() {
    this.storageManager.saveForm(this.startForm.value);

    if (this.oneDeviceControl.value == true) {
      this.router.navigate(['/game', this.getDataForLink()]);
      return;
    }

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
    const url = location.origin + this.appRoot + this.gamePath + "/" + this.getDataForLink();
    return url
  }

  getDataForLink() {
    const category = this.getCategory(this.categoriesFormControl.value, this.categoriesRandomFormControl.value)
    const settings: Settings = {
      phrase: getRandom(category.values),
      category: this.showCategoryFormControl.value ? category.name : null,
      spies: this.getSpies(this.spiesFormControl.value, this.spiesRandomFormControl.value, this.playersFormControl.value, this.oneSpyChance.value),
      starts: randomPlayer(this.playersFormControl.value),
      playersCount: this.playersFormControl.value,
      oneDevice: this.oneDeviceControl.value
    }
    return this.codec.compress(settings)
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

  getSpies(spies: number, spiesRandom: boolean, players: number, oneSpyChance: number) {
    let spiesNumber = spies;
    if (spiesRandom) {
      spiesNumber = getRandomSpies(players, oneSpyChance)
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
        this.oneSpyChance.setValidators([Validators.required]);
        this.oneSpyChance.enable();
      } else {
        this.spiesFormControl.setValidators([Validators.required]);
        this.spiesFormControl.enable();
        this.oneSpyChance.clearValidators();
        this.oneSpyChance.disable();
      }
      this.spiesFormControl.updateValueAndValidity();
      this.oneSpyChance.updateValueAndValidity();
    });
  }

  checkedRandomCategory() {
    this.categoriesRandomFormControl.valueChanges.subscribe(val => {
      if (this.categoriesRandomFormControl.value == true) {
        this.categoriesFormControl.clearValidators();
        this.categoriesFormControl.disable();
      } else {
        this.categoriesFormControl.setValidators([Validators.required]);
        this.categoriesFormControl.enable();
      }
      this.categoriesFormControl.updateValueAndValidity();
    });
  }

  checkedOneDevice() {
    this.oneDeviceControl.valueChanges.subscribe(val => {
      if (this.oneDeviceControl.value == true) {
        this.linksFormControl.clearValidators();
        this.linksFormControl.disable();
      } else {
        this.linksFormControl.setValidators([Validators.required]);
        this.linksFormControl.enable();
      }
      this.linksFormControl.updateValueAndValidity();
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
  starts: number,
  playersCount: number,
  oneDevice: boolean
}

function getRandom(data: any) {
  return data[Math.floor(Math.random() * data.length)]
}

function randomPlayer(max: number) {
  return Math.floor(Math.random() * max) + 1
}

function getRandomSpies(players: number, oneSpyChance: number) {
  const chaosChance = (100 - oneSpyChance) / 100;
  if (Math.random() > chaosChance) {
    return 1;
  }

  // wypadlo ze bedzie inna liczba szpiegow niz 1
  const effectiveMax = Math.min(players, CONFIG.MAX_SPIES_LIMIT);
  const pool = effectiveMax;
  const roll = Math.floor(Math.random() * pool);
  return roll < 1 ? 0 : roll + 1;
}