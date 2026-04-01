import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
  id: 'dreamui-resend',
  name: 'Resend Emails',
  icon: 'mail',
  routes: [
    {
      path: '',
      component: ModuleComponent,
    },
  ],
});
