const app = require("../app");
const { describe, it, before } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');
const cheerio = require('cheerio');

const {
  addTestDatabaseConfigIfConfigDatabaseModuleExists,
  loadModule,
  suppressRequestLogging,
} = require('./utils');
const {
  checkHeading,
  setDomElements,
} = require('./utils/form');

const runSpecs = () => {
  let bail = false;
  let app = null;

  addTestDatabaseConfigIfConfigDatabaseModuleExists();

  // Test that the `app` module exists.

  describe('`app` module exists', () => {
    app = loadModule('../app');

    if (app === null) {
      bail = true;
      return;
    }

    suppressRequestLogging(app);
  });

  if (bail) return;

  // Test that the `routes` module exists.

  describe('`root` route module exists', () => {
    const routes = loadModule('../routes/root');

    if (routes === null) {
      bail = true;
      return;
    }

    // Test that the default route returns the expected response.

    describe('default (`/`) route exists', () => {
      let $ = null;
      before(async () => {
        const res = await request(app)
          .get('/')
          .expect('Content-type', /html/)
          .expect(200);

        $ = setDomElements(res);
      });

      it(`should render an \`<title>\` heading containing the text "Welcome to C.A.R.L."`, () => {
        const heading = $(`title`);
        expect(heading.text()).to.equal("Welcome to C.A.R.L.");
      });

      it('should render a "Login" <a> element with an `href` attribute set to "/users/login" in the top navbar', () => {
        const loginHyperlink = $('a[href="/users/login"]');
        expect(loginHyperlink.length).to.equal(1);
        expect(loginHyperlink.text()).to.equal('Log In');
      });

      it('should render a "Register" <a> element with an `href` attribute set to "/users/register" in the top navbar', () => {
        const registerHyperlink = $('a[href="/users/register"]');
        expect(registerHyperlink.length).to.equal(1);
        expect(registerHyperlink.text()).to.equal('Get Started Now');
      });

      it('should render Github icons linking to each project member\'s github', () => {
        const homeHyperlink = $('i');
        expect(homeHyperlink.length).to.equal(4);
        expect(homeHyperlink.eq(0).text()).to.equal(' Cole');
        expect(homeHyperlink.eq(1).text()).to.equal(' Arom');
        expect(homeHyperlink.eq(2).text()).to.equal(' Rocky');
        expect(homeHyperlink.eq(3).text()).to.equal(' Lora');
      });
    });
  });

  // if (bail) return;

  // Test that the `package.json` file
  // defines the expected `start` script.

  // describe('`package.json` file', () => {
  //   const fileContents = readFile(`${__dirname}/../package.json`);

  //   if (fileContents === null) {
  //     bail = true;
  //     return;
  //   }

  //   it('should define a `start` script that starts the application using the `nodemon` command', () => {
  //     expect(fileContents).to.match(/"start":\s*"nodemon \.\/bin\/www"/);
  //   });
  // });
};

runSpecs();
