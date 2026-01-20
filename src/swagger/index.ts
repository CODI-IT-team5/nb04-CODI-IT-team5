import schemas from './components/schemas.json' with { type: 'json' };
import baseSpec from './openapi.base.json' with { type: 'json' };
import authPaths from './paths/auth.json' with { type: 'json' };
import cartPaths from './paths/cart.json' with { type: 'json' };
import dashboardPaths from './paths/dashboard.json' with { type: 'json' };
import inquiriesPaths from './paths/inquiries.json' with { type: 'json' };
import metadataPaths from './paths/metadata.json' with { type: 'json' };
import notificationsPaths from './paths/notifications.json' with { type: 'json' };
import ordersPaths from './paths/orders.json' with { type: 'json' };
import productsPaths from './paths/products.json' with { type: 'json' };
import reviewsPaths from './paths/reviews.json' with { type: 'json' };
import s3Paths from './paths/s3.json' with { type: 'json' };
import storesPaths from './paths/stores.json' with { type: 'json' };
import usersPaths from './paths/users.json' with { type: 'json' };

export const openAPIDocument = {
  ...baseSpec,
  components: schemas,
  paths: {
    ...authPaths,
    ...usersPaths,
    ...storesPaths,
    ...productsPaths,
    ...cartPaths,
    ...ordersPaths,
    ...reviewsPaths,
    ...inquiriesPaths,
    ...notificationsPaths,
    ...metadataPaths,
    ...dashboardPaths,
    ...s3Paths,
  },
};
