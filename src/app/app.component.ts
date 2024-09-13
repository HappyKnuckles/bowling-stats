import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, IonApp, IonBackdrop, IonSpinner, IonRouterOutlet } from '@ionic/angular/standalone';
import { ToastService } from './services/toast/toast.service';
import { LoadingService } from './services/loader/loading.service';
import { UserService } from './services/user/user.service';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';
import { ToastComponent } from './components/toast/toast.component';
import { SwUpdate } from '@angular/service-worker';
import { register } from 'swiper/element/bundle';
import { ThemeChangerService } from './services/theme/theme-changer.service';
import { HttpClient } from '@angular/common/http';
register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, NgIf, IonBackdrop, IonSpinner, IonRouterOutlet, ToastComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = false;
  private loadingSubscription: Subscription;
  private userNameSubscription: Subscription;
  commitMessage = '';
  username = '';

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private userService: UserService,
    private swUpdate: SwUpdate,
    private themeService: ThemeChangerService,
    private http: HttpClient
  ) {
    this.initializeApp();

    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
    this.userNameSubscription = this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  initializeApp(): void {
    // Listen for version updates and prompt the user
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        // Fetch the latest commits from the master branch on GitHub
        this.http.get('https://api.github.com/repos/HappyKnuckles/bowling-stats/commits?sha=master').subscribe({
          next: (data: any) => {
            const lastCommitSha = localStorage.getItem('lastCommitSha');
            const newCommits = [];

            for (const commit of data) {
              if (lastCommitSha && commit.sha === lastCommitSha) break;
              newCommits.push(commit.commit.message);
            }

            if (newCommits.length > 0) {
              const commitMessages = newCommits.join('\n');
              if (confirm(`A new version is available. Load it?Changes:\n${commitMessages}\n`)) {
                localStorage.setItem('lastCommitSha', data[0].sha);
                window.location.reload();
              }
            }
          },
          error: (error) => {
            console.error('Failed to fetch the latest commits:', error);
            if (confirm('A new version is available. Load it?')) {
              window.location.reload();
            }
          },
        });
      }
    });
  }

  ngOnInit(): void {
    const currentTheme = this.themeService.getCurrentTheme();
    this.themeService.applyTheme(currentTheme);
    this.greetUser();
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
    this.userNameSubscription.unsubscribe();
  }

  async greetUser(): Promise<void> {
    if (!this.username) {
      await this.showEnterNameAlert();
    } else {
      this.presentGreetingAlert(this.username);
    }
  }

  async showEnterNameAlert() {
    const alert = await this.alertController.create({
      header: 'Welcome!',
      message: 'Please enter your name:',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Your Name',
          cssClass: 'nameInput',
        },
      ],
      buttons: [
        {
          text: 'Confirm',
          handler: (data) => {
            const newName = data.username.trim();
            if (newName !== '') {
              this.userService.setUsername(newName);
              this.toastService.showToast(`Name updated to ${this.username}`, 'reload-outline');
            }
          },
        },
      ],
      cssClass: 'alert-header-white alert-message-white',
    });

    await alert.present();
  }

  async presentGreetingAlert(name: string): Promise<void> {
    const alert = await this.alertController.create({
      header: `Hello ${name}!`,
      buttons: [
        {
          text: 'Hi',
        },
        {
          text: 'Change Name',
          handler: () => {
            this.showEnterNameAlert();
          },
        },
      ],
      cssClass: 'alert-header-white alert-message-white',
    });

    await alert.present();
  }
}
