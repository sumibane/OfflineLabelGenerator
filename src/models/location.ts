export type Location = {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  stateCode: string | null;
  districtCode: string | null;
  governmentCode: string | null;
  latitude: number | null;
  longitude: number | null;
  searchName: string;
};
