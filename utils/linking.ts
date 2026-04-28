import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'app://'],

  config: {
    screens: {
      // Auth screens
      '(auth)': {
        screens: {
          login: 'login',
          signup: 'signup',
        },
      },

      // App screens
      '(tabs)': {
        screens: {
          index: 'home',
          favorites: 'favorites',
          'product/[id]': 'product/:id',
          checkout: 'checkout',
          'order-confirmation': 'order-confirmation',
        },
      },

      // Catch all
      '*': '*',
    },
  },
};
