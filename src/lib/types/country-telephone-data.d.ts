declare module "country-telephone-data" {
  export const allCountries: {
    name: string;
    iso2: string;
    dialCode: string;
    priority: number;
    areaCodes?: string[];
  }[];

  const data: {
    allCountries: typeof allCountries;
  };

  export default data;
}
