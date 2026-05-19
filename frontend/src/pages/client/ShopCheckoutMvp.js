/**
 * @deprecated ShopCheckoutPage 사용. 하위 호환 리다이렉트.
 *
 * @author MindGarden
 * @since 2026-05-14
 */

import { Navigate } from 'react-router-dom';

const ShopCheckoutMvp = () => <Navigate to="/client/shop/checkout" replace />;

export default ShopCheckoutMvp;
