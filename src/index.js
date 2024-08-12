// Configure I18n
const i18n = require('i18n');

i18n.configure({
  locales: ['de', 'en', 'pt', 'fr'],
  staticCatalog: {
    de: require('./locales/de.json'),
    en: require('./locales/en.json'),
    pt: require('./locales/pt.json'),
    fr: require('./locales/fr.json'),
  },
  directory: '.'
});

const PHONE_TYPE = {
  ANDROID: 'ANDROID',
  IOS: 'IOS'
};

class AddToHomeScreen {

  /**
   * Summary. (use period)
   *
   * Description. (use period)
   *
   *
   * @param {string} appName                                 The name of the app e.g. 'Aardvark'.  
   *                                                         Try to keep as short as possible as this is displayed in the install message on the device.
   * 
   * @param {URL} appIconUrl                                 URL link to the app icon e.g. "https://aardvark.app/icon.png" .  
   *                                                         Should have rounded corners, square, and larger than 40 x 40 pixels.
   *
   * 
   * @param {URL} assetUrl                                   directory of static image assets needed by the AddToHomeScreen framework e.g. "https://aardvark.app/dist/assets/img/"
   * 
   *
   * @param {int} maxModalDisplayCount                       If set, the modal will only show this many times.
   *                                                         Default is -1 (no limit).  (Debugging: Use this.clearModalDisplayCount() to reset the count)
   */
  constructor({
    appName,
    appIconUrl,
    assetUrl,
    maxModalDisplayCount
  }) {
    this.appName = appName;
    this._assertArg(
      "appName",
      typeof this.appName === "string" && this.appName.length > 0
    );
    this.appIconUrl = appIconUrl;
    this._assertArg(
      "appIconUrl",
      typeof this.appIconUrl === "string" && this.appIconUrl.length > 0
    );
    this.assetUrl = assetUrl;
    this._assertArg(
      "assetUrl",
      typeof this.assetUrl === "string" && this.assetUrl.length > 0
    );
    this.maxModalDisplayCount = (maxModalDisplayCount === undefined) ? -1 : maxModalDisplayCount;
    this._assertArg(
      "maxModalDisplayCount",
      Number.isInteger(this.maxModalDisplayCount)
    );
    this.closeEventListener = null;
  }


  isStandAlone() {
    // test if web app is already installed to home screen
    return window.navigator.standalone || // IOS (TODO: detect iPad 13)
      window.matchMedia('(display-mode: standalone)').matches; // Android
  }


  show(locale='en') {
    i18n.setLocale(locale);
    var ret;
    var shouldShowModal = false;
    if (this.isStandAlone()) {
      shouldShowModal = false;
      ret = new AddToHomeScreen.ReturnObj(
        {
          isStandAlone: true,
          canBeStandAlone: true,
          device: (this.isDeviceIOS() ? AddToHomeScreen.PHONE_TYPE.IOS : AddToHomeScreen.PHONE_TYPE.ANDROID)
        }
      );
      return ret;
    } else if (this._hasReachedMaxModalDisplayCount()) {
      shouldShowModal = false;
      ret = new AddToHomeScreen.ReturnObj(
        {
          isStandAlone: null,
          canBeStandAlone: null,
          device: (this.isDeviceIOS() ? AddToHomeScreen.PHONE_TYPE.IOS : AddToHomeScreen.PHONE_TYPE.ANDROID)
        }
      );
      return ret;
    } else {      
      shouldShowModal = true;
      this._incrModalDisplayCount();
      const container = document.createElement('div');
      container.classList.add('adhs-container');

      // dark overlay covers entire body
      container.style.height = document.body.clientHeight + 'px';
      //container.style.width = document.body.clientWidth + 'px';
      container.style.width = window.innerWidth + 'px';

      if (this.isDeviceIOS()) { // ios
        if (this.isBrowserIOSSafari()) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: true,
              device: AddToHomeScreen.PHONE_TYPE.IOS
            }
          );
          this._genIOSSafari(container);
        } else if (this.isBrowserIOSChrome()) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: true,
              device: AddToHomeScreen.PHONE_TYPE.IOS
            }
          );
          this._genIOSChrome(container);
        } else if (
          this.isBrowserIOSInAppFacebook() ||
          this.isBrowserIOSInAppLinkedin()
        ) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: false,
              device: AddToHomeScreen.PHONE_TYPE.IOS
            }
          );
          this._genIOSInAppBrowserOpenInSystemBrowser(container);
        } else if (
          this.isBrowserIOSInAppInstagram() ||
          this.isBrowserIOSInAppThreads() ||
          this.isBrowserIOSInAppTwitter()
        ) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: false,
              device: AddToHomeScreen.PHONE_TYPE.IOS
            }
          );
          this._genIOSInAppBrowserOpenInSafariBrowser(container);
        } else {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: false,
              device: AddToHomeScreen.PHONE_TYPE.IOS
            }
          );
          shouldShowModal = false;
        }
      } else if (this.isDeviceAndroid()) { // android
        if (this.isBrowserAndroidChrome()) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: true,
              device: AddToHomeScreen.PHONE_TYPE.ANDROID
            }
          );
          this._genAndroidChrome(container);
        } else if (this.isBrowserAndroidFacebook()) {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: false,
              device: AddToHomeScreen.PHONE_TYPE.ANDROID
            }
          );
          this._genIOSInAppBrowserOpenInSystemBrowser(container);
        } else {
          ret = new AddToHomeScreen.ReturnObj(
            {
              isStandAlone: false,
              canBeStandAlone: false,
              device: AddToHomeScreen.PHONE_TYPE.ANDROID
            }
          );
          shouldShowModal = false;
        }
      } else { // desktop
        ret = new AddToHomeScreen.ReturnObj(
          {
            isStandAlone: false,
            canBeStandAlone: false,
            device: ''
          }
        );
        shouldShowModal = false;
      }

      if (shouldShowModal) {
        document.body.appendChild(container);
        this._registerCloseListener();
        setTimeout(() => {
          container.classList.add('visible');
        }, 50);
      }
    }

    return ret;

  }

  close() {
    // close the modal if the user clicks outside of the modal contents
    const container = document.querySelector('.adhs-container');
    if (container) {
      container.classList.remove('visible');
      setTimeout(() => {
        container.remove();
        if (this.closeEventListener) {
          window.removeEventListener('touchstart', this.closeEventListener);
          window.removeEventListener('click', this.closeEventListener);
          this.closeEventListener = null;
        }
      }, 300);
    }
  }

  /**** Device Detection Functions ****/

  isDeviceAndroid() {
    return navigator.userAgent.match(/Android/);
  }

  isDeviceIOS() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/);
  }

  // isBrowserIOSIPadSafari() {
  //   return navigator.userAgent.match(/Macintosh/) && 
  //   navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
  // }

  /* Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X)
   AppleWebKit/603.1.23 (KHTML, like Gecko) Version/10.0
   Mobile/14E5239e Safari/602.1 */
  isBrowserIOSSafari() {
    return this.isDeviceIOS() &&
      window.navigator.userAgent.match(/Safari/) &&
      !this.isBrowserIOSChrome() &&
      !this.isBrowserIOSFirefox() &&
      !this.isBrowserIOSInAppFacebook() &&
      !this.isBrowserIOSInAppLinkedin() &&
      !this.isBrowserIOSInAppInstagram() &&
      !this.isBrowserIOSInAppThreads() &&
      !this.isBrowserIOSInAppTwitter();
  }

  /* Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X)
     AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75
     Mobile/14E5239e Safari/602.1 */
  isBrowserIOSChrome() {
    return this.isDeviceIOS() && navigator.userAgent.match(/CriOS/);
  }

  /* Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) 
  AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/114.1 Mobile/15E148 Safari/605.1.15 */
  isBrowserIOSFirefox() {
    return this.isDeviceIOS() && window.navigator.userAgent.match(/FxiOS/);
  }

  isBrowserIOSInAppFacebook() {
    if (!this.isDeviceIOS()) {
      return false;
    }

    return window.navigator.userAgent.match(/FBAN|FBAV/);
  }

  isBrowserIOSInAppLinkedin() {
    if (!this.isDeviceIOS()) {
      return false;
    }

    return window.navigator.userAgent.match(/LinkedInApp/);
  }

  isBrowserIOSInAppInstagram() {
    if (!this.isDeviceIOS()) {
      return false;
    }


    // TODO: this is incompatible with Instagram/Threads mobile website links.
    // TODO: this solution only works with first-level links
    if (window.document.referrer.match('//l.instagram.com/')) {
      return true;
    }

    // Instagram and Threads in-app browsers only 
    // take up ~90% of the height of the screen
    if (window.navigator.userAgent.match(/iPhone/) &&
      window.screen.height && window.outerHeight &&
      window.outerHeight < window.screen.height) {
      return true;
    }

    return false;
  }

  isBrowserIOSInAppThreads() {
    return this.isBrowserIOSInAppInstagram();
  }

  isBrowserIOSInAppTwitter() {
    if (!this.isDeviceIOS()) {
      return false;
    }

    // TODO: this solution is incompatible with Twitter mobile website links
    // TODO: this solution only works with first-level links
    return window.document.referrer.match('//t.co/');
  }

  /* Mozilla/5.0 (Linux; Android 10) 
     AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.92 Mobile Safari/537.36 */
  isBrowserAndroidChrome() {
    return this.isDeviceAndroid() &&
      window.navigator.userAgent.match(/Chrome/) &&
      !this.isBrowserAndroidFacebook() &&
      !this.isBrowserAndroidSamsung() &&
      !this.isBrowserAndroidFirefox();
  }

  /*Mozilla/5.0 (Linux; Android 12; SM-S908U1 Build/SP1A.210812.016; wv) 
    AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.88 
    Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/377.0.0.22.107;]*/
  isBrowserAndroidFacebook() {
    return this.isDeviceAndroid() && window.navigator.userAgent.match(/FBAN|FBAV/);
  }

  /* Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 
  (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36 */
  isBrowserAndroidSamsung() {
    return this.isDeviceAndroid() && window.navigator.userAgent.match(/SamsungBrowser/);
  }

  /* Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/114.0 Firefox/114.0 */
  isBrowserAndroidFirefox() {
    return this.isDeviceAndroid() && window.navigator.userAgent.match(/Firefox/);
  }

  /**** Internal Functions ****/

  _assertArg(variableName, booleanExp) {  
    if (!booleanExp) {
      throw new Error("AddToHomeScreen: variable '" + variableName + "' has an invalid value.");
    }
  }

  _genLogo() {
    return `
      <div class="adhs-logo">
        <img src="` + this.appIconUrl + `" alt="logo" />
      </div>
      `;
  }

  _genErrorMessage(container, title, body) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      `<div class="adhs-error-title">` + title + `</div>` +
      `<div class="adhs-error-body">` + body + `</div>` +
      `<button class="adhs-error-copy-link-button" onclick="AddToHomeScreen.copyToClipboard();" ontouchstart="AddToHomeScreen.copyToClipboard();">${i18n.__('Copy Website Link to Clipboard')}</button>` +
      this._genModalEnd();
    container.innerHTML = containerInnerHTML;
  }


  _genTitleWithMessage(message) {
    return `
      <div class="adhs-title">` + message + `</div>
      `;
  }

  _genTitle() {
    return this._genTitleWithMessage(i18n.__('Install the %s app to continue', this.appName));
  }

  _genModalStart() {
    return `<div class="adhs-modal">`;
  }

  _genModalEnd() {
    return `</div>`;
  }

  _genListStart() {
    return `<div class="adhs-list">`;
  }

  _genListEnd() {
    return `</div>`;
  }

  _genListItem(numberString, instructionHTML) {
    return `
    <div class="adhs-list-item">
      <div class="adhs-number-container">
        <div class="adhs-circle">
          <div class="adhs-number">` + numberString + `</div>
        </div>
      </div>
      <div class="adhs-instruction">` + instructionHTML + `</div>
    </div>`;
  }

  _genAssetUrl(fileName) {
    return this.assetUrl + fileName;
  }

  _genIOSSafari(container) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      this._genTitle() +
      this._genListStart() +
      this._genListItem(`1`, i18n.__('Tap the %s button bellow.', `<img class="adhs-ios-safari-sharing-api-button" src="${this._genAssetUrl('ios-safari-sharing-api-button.svg')}" />`)) +
      this._genListItem(`2`, i18n.__('Select %s from the menu that pops up.', `<img class="adhs-ios-safari-add-to-home-screen-button" src="${this._genAssetUrl('ios-safari-add-to-home-screen-button.svg')}" />`) + ` <span class="adhs-emphasis">${i18n.__('You may need to scroll down to find this menu item.')}</span>`) +
      this._genListItem(`3`, i18n.__('Open the %s app.', `<img class="adhs-your-app-icon" src="${this.appIconUrl}"/>`)) +
      this._genListEnd() +
      this._genModalEnd() +
      `<div class="adhs-ios-safari-bouncing-arrow-container">
      <img src="` + this._genAssetUrl('ios-safari-bouncing-arrow.svg') + `" alt="arrow" />
    </div>`;
    container.innerHTML = containerInnerHTML;
    container.classList.add('adhs-ios');
    container.classList.add('adhs-safari');
  }

  _genIOSChrome(container) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      this._genTitle() +
      this._genListStart() +
      this._genListItem(`1`, i18n.__('Tap the %s button in the upper right corner.', `<img class="adhs-ios-chrome-more-button" src="${this._genAssetUrl('ios-chrome-more-button.svg')}"/>`)) +
      this._genListItem(`2`, i18n.__('Select %s from the menu that pops up.', `<img class="adhs-ios-chrome-add-to-home-screen-button" src="${this._genAssetUrl('ios-chrome-add-to-home-screen-button.svg')}"/>`) + ` <span class="adhs-emphasis">${i18n.__('You may need to scroll down to find this menu item.')}</span>`) +
      this._genListItem(`3`, i18n.__('Open the %s app.', `<img class="adhs-your-app-icon" src="${this.appIconUrl}"/>`)) +
      this._genListEnd() +
      this._genModalEnd() +
      `<div class="adhs-ios-chrome-bouncing-arrow-container">
      <img src="` + this._genAssetUrl('ios-chrome-bouncing-arrow.svg') + `" alt="arrow" />
    </div>`;
    container.innerHTML = containerInnerHTML;
    container.classList.add('adhs-ios');
    container.classList.add('adhs-chrome');
  }

  _genIOSInAppBrowserOpenInSystemBrowser(container) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      this._genTitle() +
      this._genListStart() +
      this._genListItem(`1`, i18n.__('Tap the %s button above.', `<img class="adhs-more-button" src="${this._genAssetUrl('generic-more-button.svg')}"/>`)) +
      this._genListItem(`2`, `${i18n.__('Tap')} <span class="adhs-emphasis">${i18n.__('Open in browser')}</span>.`) +
      this._genListEnd() +
      this._genModalEnd() +
      `<div class="adhs-inappbrowser-openinsystembrowser-bouncing-arrow-container">
      <img src="` + this._genAssetUrl('generic-vertical-up-bouncing-arrow.svg') + `" alt="arrow" />
    </div>`;
    container.innerHTML = containerInnerHTML;
    container.classList.add('adhs-ios');
    container.classList.add('adhs-inappbrowser-openinsystembrowser');
  }

  _genIOSInAppBrowserOpenInSafariBrowser(container) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      this._genTitle() +
      this._genListStart() +
      this._genListItem(`1`, i18n.__('Tap the %s button below to open your system browser.', `<img class="adhs-more-button" src="${this._genAssetUrl('openinsafari-button.png')}"/>`)) +
      this._genListEnd() +
      this._genModalEnd() +
      `<div class="adhs-inappbrowser-openinsafari-bouncing-arrow-container">
      <img src="` + this._genAssetUrl('generic-vertical-down-bouncing-arrow.svg') + `" alt="arrow" />
    </div>`;
    container.innerHTML = containerInnerHTML;
    container.classList.add('adhs-ios');
    container.classList.add('adhs-inappbrowser-openinsafari');
  }

  _genAndroidChrome(container) {
    var containerInnerHTML =
      this._genLogo() +
      this._genModalStart() +
      this._genTitle() +
      this._genListStart() +
      this._genListItem(`1`, i18n.__('Tap the %s button in the browser bar.', `<img class="adhs-android-chrome-more-button" src="${this._genAssetUrl('android-chrome-more-button.svg')}"/>`)) +
      this._genListItem(`2`, i18n.__('Tap the %s or %s button.', `<img class="adhs-android-chrome-add-to-homescreen-button" src="${this._genAssetUrl('android-chrome-add-to-home-screen-button.svg')}"/>`, `<img class="adhs-android-chrome-install-app" src="${this._genAssetUrl('android-chrome-install-app.svg')}"/>`)) +
      this._genListItem(`3`, i18n.__('Open the %s app.', `<img class="adhs-your-app-icon" src="${this.appIconUrl}"/>`)) +
      this._genListEnd() +
      this._genModalEnd() +
      `<div class="adhs-android-chrome-bouncing-arrow-container">
      <img src="` + this._genAssetUrl('android-chrome-bouncing-arrow.svg') + `" alt="arrow" />
    </div>`;
    container.innerHTML = containerInnerHTML;
    container.classList.add('adhs-android');
    container.classList.add('adhs-chrome');
  }

  _registerCloseListener() {

    var self = this;
    this.closeEventListener = function (e) {
      var modal = document.getElementsByClassName('adhs-container')[0].getElementsByClassName('adhs-modal')[0];
      if (!modal.contains(e.target)) {
        self.close();
      };
    };
    window.addEventListener('touchstart', this.closeEventListener);
    window.addEventListener('click', this.closeEventListener);

  }

  clearModalDisplayCount() {
    if (this._isEnabledModalDisplayCount()) {
      window.localStorage.removeItem('adhs-modal-display-count');
    }
  }

  _isEnabledModalDisplayCount() {
    return (typeof (this.maxModalDisplayCount) === 'number') && (this.maxModalDisplayCount >= 0) && window.localStorage;
  }

  _hasReachedMaxModalDisplayCount() {
    if (!this._isEnabledModalDisplayCount()) {
      return false;
    }
    return (this._getModalDisplayCount() >= this.maxModalDisplayCount);
  }

  _incrModalDisplayCount() {
    if (!this._isEnabledModalDisplayCount()) {
      return false;
    }

    var count = this._getModalDisplayCount();
    count++;
    window.localStorage.setItem('adhs-modal-display-count', count);
    return true;
  }

  _getModalDisplayCount() {
    var count = window.localStorage.getItem('adhs-modal-display-count');
    if (count === null) {
      count = 0;
      window.localStorage.setItem('adhs-modal-display-count', count);
    } else {
      count = parseInt(count);
    }
    return count;
  }

  static copyToClipboard() {
    const currentUrl = window.location.href;
    try {
      window.navigator.clipboard.writeText(currentUrl);
      document.getElementsByClassName('adhs-error-copy-link-button')[0].innerHTML = i18n.__('Link Copied to Clipboard!');
    } catch (err) {
      // android browser doesn't support clipboard API if not an https link
      document.getElementsByClassName('adhs-error-copy-link-button')[0].innerHTML = i18n.__('Failed to Copy to Clipboard! (Try Again from "https://" Link)');
    }
  }
}

AddToHomeScreen.PHONE_TYPE = PHONE_TYPE;

AddToHomeScreen.ReturnObj = class R {
  constructor({ isStandAlone, canBeStandAlone, device }) {
    this.isStandAlone = isStandAlone;
    this.canBeStandAlone = canBeStandAlone;
    this.device = device; // IOS, ANDROID, or '' (desktop/unknown)
  }
}

export default AddToHomeScreen;
