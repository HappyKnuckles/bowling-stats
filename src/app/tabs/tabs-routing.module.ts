import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'add',
        loadChildren: () => import('../Pages/add-game/add-game.module').then((m) => m.AddGamePageModule),
      },
      {
        path: 'stats',
        loadChildren: () => import('../Pages/stats/stats.module').then((m) => m.StatsPageModule),
      },
      {
        path: 'history',
        loadChildren: () => import('../Pages/history/history.module').then((m) => m.HistoryPageModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('../Pages/settings/settings.module').then((m) => m.SettingsPageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/add',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/add',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
