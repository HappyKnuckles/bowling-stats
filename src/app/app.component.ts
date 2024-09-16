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
import { GameStatsService } from './services/game-stats/game-stats.service';
import { GameHistoryService } from './services/game-history/game-history.service';
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
    private http: HttpClient,
    private gameStatsService: GameStatsService,
    private gameHistoryService: GameHistoryService
  ) {
    this.initializeApp();
    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
    this.userNameSubscription = this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  //TODO maybe implement custom alert to have title etc instead of confirm
  initializeApp(): void {
    // Listen for version updates and prompt the user
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        const lastCommitDate = localStorage.getItem('lastCommitDate');
        const sinceParam = lastCommitDate ? `&since=${lastCommitDate}` : '';
        const apiUrl = `https://api.github.com/repos/HappyKnuckles/bowling-stats/commits?sha=master${sinceParam}`;

        // Fetch the latest commits from the master branch on GitHub
        this.http.get(apiUrl).subscribe({
          next: (data: any) => {
            const newCommits = [];

            for (const commit of data) {
              newCommits.push(commit.commit.message);
            }

            if (newCommits.length > 0) {
              const commitMessages = newCommits.join('\n');
              if (confirm(`**New Version Available**\n\nChanges:\n${commitMessages}\n\nLoad it?`)) {
                localStorage.setItem('lastCommitDate', new Date(data[0].commit.committer.date).toISOString());
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

  async ngOnInit(): Promise<void> {
    // Load stats here initially so prevstats are loaded before the first game
    const gameHistory = await this.gameHistoryService.loadGameHistory();
    this.gameStatsService.calculateStats(gameHistory);

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
