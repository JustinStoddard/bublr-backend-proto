import { get } from "./env";

require('source-map-support').install();

const setup = () => {

  //Setup DataSources
  const url = new URL(get('POSTGRES_URL'));

};

setup();