# Restaurant Ordering System - Customer Frontend

A mobile-first React application for restaurant table ordering via QR codes. Customers scan QR codes at their tables to browse menus and place orders directly to the kitchen.

## Features

### Core Functionality
- 📱 Mobile-first responsive design
- 🔗 QR code scanning for table identification
- 🍽️ Interactive menu browsing with categories
- 🛒 Shopping cart with persistence
- 📋 Order management and history
- 🔄 Real-time order status updates
- 💾 Offline support with service workers

### User Experience
- ⚡ Fast loading with code splitting
- 🎨 Smooth animations with Framer Motion
- 🔍 Search and filter capabilities
- 🎯 44px+ touch targets for mobile
- ♿ Accessible design patterns
- 🌐 Progressive Web App (PWA) ready

### Technical Features
- 🔥 React 18+ with hooks and functional components
- 🗃️ Supabase for real-time database
- ☁️ AWS Lambda integration for serverless APIs
- 🎭 Error boundaries for robust error handling
- 📊 Performance optimizations with virtual scrolling
- 🔄 Background sync for offline orders

## Tech Stack

- **Frontend**: React 18, React Router v6
- **Styling**: Custom CSS with CSS variables
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Context API + useReducer
- **Database**: Supabase (PostgreSQL)
- **APIs**: AWS Lambda + API Gateway
- **Caching**: Service Worker + localStorage
- **Build**: Create React App

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account and project
- AWS account for Lambda deployment

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd customer
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and AWS credentials
   ```

3. **Set up Supabase database**
   ```bash
   # Run the SQL schema in your Supabase dashboard
   cat database-schema.sql
   ```

4. **Start development server**
   ```bash
   npm start
   # App runs on http://localhost:3000
   ```

### Environment Configuration

Required environment variables:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_BASE_URL=https://your-lambda-api.amazonaws.com
```

## Usage

### For Customers

1. **Scan QR Code**: Use phone camera to scan table QR code
2. **Browse Menu**: Navigate categories and search for items
3. **Add to Cart**: Tap items to view details and add to cart
4. **Place Order**: Review cart and submit order
5. **Track Status**: Monitor order progress in real-time

### QR Code Format
```
https://your-domain.com/qr?table=15
```

### For Restaurant Staff

The system integrates with restaurant management APIs to:
- Receive orders in real-time
- Update order status (confirmed → preparing → ready)
- Manage menu availability
- Track table sessions

## Architecture

### Component Structure
```
src/
├── components/           # React components
│   ├── QRLanding.js     # QR code validation
│   ├── MenuContainer.js # Main menu interface
│   ├── Cart.js          # Shopping cart
│   ├── OrderHistory.js  # Order tracking
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useCart.js       # Cart state management
│   ├── useMenu.js       # Menu data & filtering
│   └── useOrders.js     # Order management
├── contexts/            # React Context providers
│   └── AppContext.js    # Global app state
├── services/            # API and external services
│   ├── supabase.js      # Database client
│   └── api.js           # Lambda API client
└── styles/              # CSS and styling
```

### Data Flow

1. **QR Scan** → Validate table → Create session
2. **Menu Load** → Fetch from Supabase → Cache locally
3. **Add to Cart** → Update local state → Persist to localStorage
4. **Place Order** → Validate items → Submit to Lambda → Save to Supabase
5. **Real-time Updates** → Supabase subscriptions → Update UI

### Database Schema

```sql
-- Menu items with categories and availability
CREATE TABLE menu (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('meat', 'vegetable', 'sauces', 'desserts', 'drinks')),
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15,
    allergens TEXT[],
    nutritional_info JSONB
);

-- Customer orders with items and status
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    table_number INTEGER NOT NULL,
    order_items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    session_id VARCHAR(255) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to CDN
The build folder can be deployed to any CDN:
- AWS S3 + CloudFront
- Netlify
- Vercel
- Firebase Hosting

### PWA Installation
The app includes a web app manifest and service worker for PWA installation on mobile devices.

## Performance Optimizations

### Implemented
- ✅ Code splitting with React.lazy()
- ✅ Image lazy loading
- ✅ Virtual scrolling for large lists
- ✅ Service worker caching
- ✅ Request debouncing
- ✅ Memoized components and calculations

### Monitoring
- Core Web Vitals tracking
- Error boundary reporting
- Performance metrics logging
- User interaction analytics

## Mobile Optimizations

### Touch Interface
- Minimum 44px touch targets
- Swipe gestures support
- Pull-to-refresh functionality
- Haptic feedback (where supported)

### Performance
- Optimized for 3G networks
- Aggressive caching strategies
- Minimal JavaScript bundles
- Compressed images and assets

### UX Patterns
- Bottom sheet modals
- Sticky navigation elements
- Safe area handling for iOS
- Android back button support

## API Integration

### Supabase Functions
```javascript
// Real-time menu updates
const subscription = supabase
  .channel('menu-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, callback)
  .subscribe();

// Submit order
const { data, error } = await supabase
  .from('orders')
  .insert([orderData])
  .select();
```

### Lambda Endpoints
```javascript
// Menu management
GET /menu
GET /menu/:id
POST /menu/check-availability

// Order processing  
POST /orders
GET /orders/:id
PUT /orders/:id/status

// Table validation
GET /tables/:number/validate
```

## Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests
- API endpoint testing
- Database operation testing
- Real-time subscription testing

### E2E Tests
- QR code scanning flow
- Complete order placement
- Cross-device session handling

## Troubleshooting

### Common Issues

**QR Code Not Working**
- Verify table parameter in URL
- Check camera permissions
- Ensure HTTPS for camera access

**Orders Not Submitting**
- Check network connectivity
- Verify Supabase configuration
- Check browser console for errors

**Cart Not Persisting**
- Verify localStorage permissions
- Check session ID generation
- Clear browser data and retry

**Real-time Updates Not Working**
- Check Supabase RLS policies
- Verify subscription setup
- Check network connectivity

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes with tests
3. Run linting and tests
4. Submit pull request
5. Deploy after review

### Code Standards
- ESLint configuration
- Prettier formatting
- Component naming conventions
- Hook naming patterns
- CSS class naming (BEM-like)

## Security Considerations

### Data Protection
- No sensitive data in localStorage
- Sanitized user inputs
- XSS protection
- CSRF protection

### Authentication
- Session-based identification
- No permanent user accounts
- Automatic session expiry
- Secure table validation

## License

MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Check the troubleshooting section
- Review component documentation
- Submit GitHub issues for bugs
- Contact development team for features

---

Built with ❤️ for modern restaurant experiences