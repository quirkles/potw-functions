export const documentsToPreserve: {
    firebase: {
        [key: string]: string[];
    },
    postgres: {
        [key: string]: string[];
    }
} = {
  firebase: {
    users: [],
  },
  postgres: {
    users: [],
  },
};
