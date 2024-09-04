import { Injectable } from '@angular/core';
import { AdMob, AdmobConsentStatus, AdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';

@Injectable({
  providedIn: 'root'
})
export class AdService {

  constructor() {
    this.init();
  }

  async init() {
    await this.initializeAdMob();
  }

  async initializeAdMob() {
    await AdMob.initialize();

    const [trackingInfo, consentInfo] = await Promise.all([
      AdMob.trackingAuthorizationStatus(),
      AdMob.requestConsentInfo(),
    ]);

    if (trackingInfo.status === 'notDetermined') {
      /**
       * If you want to explain TrackingAuthorization before showing the iOS dialog,
       * you can show the modal here.
       * ex)
       * const modal = await this.modalCtrl.create({
       *   component: RequestTrackingPage,
       * });
       * await modal.present();
       * await modal.onDidDismiss();  // Wait for close modal
       **/

      await AdMob.requestTrackingAuthorization();
    }

    const authorizationStatus = await AdMob.trackingAuthorizationStatus();
    if (
      authorizationStatus.status === 'authorized' &&
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      await AdMob.showConsentForm();
    }
  }

  async showIntertistalAd() {
    const options: AdOptions = {
      // adId: 'ca-app-pub-5244538287702059/5612009313',
      adId: 'ca-app-pub-3940256099942544/1033173712'
    };

    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  }

  async showRewardedAd(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const options: AdOptions = {
        // adId: 'ca-app-pub-5244538287702059/1758897353'
        adId: 'ca-app-pub-3940256099942544/5224354917', // Replace with your Ad Unit ID
        isTesting: true, // Remove this line when you are ready to go live
      };

      await AdMob.prepareRewardVideoAd(options);

      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
        reject(new Error('Ad not watched'));
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
        reject(new Error('Ad not watched'));
      });

      AdMob.addListener(RewardAdPluginEvents.Showed, () => {
        resolve();
      });

      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        // User watched the ad and should be rewarded
        resolve();
      });

      await AdMob.showRewardVideoAd();
    });
  }
}
