export type FoiPreset = 'canonical' | 'ecological' | 'comprehensive';

export interface FoiRequestParams {
  councilName: string;
  requesterName?: string;
  preset?: FoiPreset;
  customQuestions?: string[];
  additionalNotes?: string;
  salutation?: string;
  requestSpreadsheetFormat?: boolean;
}
