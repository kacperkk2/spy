import { TestBed } from '@angular/core/testing';

import { CodecService } from './codec.service';

describe('CodecService', () => {
  let service: CodecService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodecService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
