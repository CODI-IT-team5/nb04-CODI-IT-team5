// src/app.ts
import express, { type Application } from 'express';

// 기존 라우터들 (실제 프로젝트에서 쓰는 경로/이름으로 맞춰서 수정해줘)
//import authRouter from './router/auth.routes';
//import productRouter from './router/product.routes';

// 우리가 만든 장바구니 라우터
import cartRouter from './Cart/router/cart.routes.js';

const app: Application = express();

// 공통 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use('/api/auth', authRouter);
//app.use('/api/products', productRouter);

app.use('/api/cart', cartRouter);


app.use((req, res, _next) => {
  return res.status(404).json({
    statusCode: 404,
    message: '요청한 리소스를 찾을 수 없습니다.',
    error: 'Not Found',
  });
});


export default app;
