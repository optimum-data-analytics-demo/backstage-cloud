   import { createFrontendModule } from '@backstage/frontend-plugin-api';
   import { SignInPageBlueprint } from '@backstage/plugin-app-react';
   import { SignInPage } from '@backstage/core-components';
   import { githubAuthApiRef } from '@backstage/core-plugin-api';

   const signInModule = createFrontendModule({
     pluginId: 'app',
     extensions: [
       SignInPageBlueprint.make({
         params: {
           loader: async () => props => (
             <SignInPage
               {...props}
               providers={[
                 'guest',
                 {
                   id: 'github-auth-provider',
                   title: 'GitHub',
                   message: 'Sign in using GitHub',
                   apiRef: githubAuthApiRef,
                 },
               ]}
             />
           ),
         },
       }),
     ],
   });
   // add signInModule to createApp({ features: [..., signInModule] })

import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';

export default createApp({
  features: [catalogPlugin, navModule, homeModule,signInModule],
});
