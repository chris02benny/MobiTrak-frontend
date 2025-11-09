# Dark Amber Theme Migration Guide

## Color Palette

### New Colors
- **Primary Background**: `#0D0D0D` (charcoal black) - `bg-[#0D0D0D]`
- **Card Background**: `#1F1F1F` (dark gray) - `bg-[#1F1F1F]`
- **Accent/Primary**: `#FFC107` (amber yellow) - `bg-[#FFC107]` or `text-[#FFC107]`
- **Text Primary**: `#FFFFFF` (white) - `text-white`
- **Text Secondary**: `#B0B0B0` (light gray) - `text-[#B0B0B0]`
- **Success**: `#4CAF50` (green) - `bg-[#4CAF50]` or `text-[#4CAF50]`
- **Error**: `#F44336` (red) - `bg-[#F44336]` or `text-[#F44336]`
- **Primary Hover**: `#FFB300` - `hover:bg-[#FFB300]`
- **Primary Active**: `#FFA000` - `active:bg-[#FFA000]`

## Color Replacements

### Replace Old Colors With New Colors

1. **Backgrounds**
   - `bg-black` or `bg-[#000000]` → `bg-[#0D0D0D]`
   - `bg-gray-800` or `bg-[#232323]` → `bg-[#1F1F1F]`
   - `bg-gray-900` → `bg-[#0D0D0D]`
   - `bg-gray-700` → `bg-[#1F1F1F]`

2. **Primary/Accent Colors**
   - `bg-primary-400`, `bg-primary-500`, `bg-primary-600` → `bg-[#FFC107]`
   - `bg-yellow-400`, `bg-yellow-500`, `bg-[#FEEE00]` → `bg-[#FFC107]`
   - `text-primary-400`, `text-primary-500` → `text-[#FFC107]`
   - `text-yellow-500`, `text-yellow-300` → `text-[#FFC107]`
   - `border-yellow-400`, `border-yellow-500` → `border-[#FFC107]`
   - `hover:bg-primary-600` → `hover:bg-[#FFB300]`
   - `hover:text-yellow-500` → `hover:text-[#FFC107]`

3. **Text Colors**
   - `text-gray-400` → `text-[#B0B0B0]`
   - `text-gray-500` → `text-[#B0B0B0]`
   - `text-gray-300` → `text-white`
   - `placeholder-gray-400` → Use CSS `::placeholder { color: #B0B0B0 }` (already in index.css)

4. **Borders**
   - `border-gray-600` → `border-[#1F1F1F]`
   - `border-gray-700` → `border-[#1F1F1F]`
   - `border-gray-800` → `border-[#1F1F1F]`

5. **Success/Error States**
   - `bg-green-50`, `bg-green-100` → `bg-[#4CAF50] bg-opacity-10`
   - `text-green-500`, `text-green-600`, `text-green-800` → `text-[#4CAF50]`
   - `border-green-300`, `border-green-500` → `border-[#4CAF50]`
   - `bg-red-50`, `bg-red-100` → `bg-[#F44336] bg-opacity-10`
   - `text-red-500`, `text-red-600` → `text-[#F44336]`
   - `border-red-200`, `border-red-300`, `border-red-500` → `border-[#F44336]`

6. **Other Colors to Update**
   - `bg-purple-500`, `bg-purple-600` → `bg-[#FFC107]`
   - `hover:bg-purple-600` → `hover:bg-[#FFB300]`

## Button Styles

### Primary Buttons
```jsx
className="bg-[#FFC107] text-black hover:bg-[#FFB300] active:bg-[#FFA000] font-semibold transition-all duration-200 ease-in-out"
```

### Secondary Buttons
```jsx
className="border border-[#FFC107] text-[#FFC107] hover:bg-[#1F1F1F] bg-transparent transition-all duration-200 ease-in-out"
```

### Danger Buttons
```jsx
className="bg-[#F44336] text-white hover:bg-[#D32F2F] transition-all duration-200 ease-in-out"
```

## Card Styles

```jsx
className="bg-[#1F1F1F] rounded-lg p-6 shadow-[0_4px_10px_rgba(255,193,7,0.15)] hover:shadow-[0_6px_15px_rgba(255,193,7,0.25)] transition-all duration-200 ease-in-out"
```

## Input/Form Field Styles

```jsx
className="bg-[#1F1F1F] border border-[#1F1F1F] text-white placeholder:text-[#B0B0B0] focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107] rounded-lg transition-all duration-200 ease-in-out"
```

## Sidebar Styles

- Background: `bg-[#0D0D0D]`
- Active Tab: `bg-[#1F1F1F]` with `border-l-4 border-[#FFC107]`
- Inactive Tab: hover to `hover:bg-[#1F1F1F]`
- Icons: `text-[#FFC107]` for active, `text-[#B0B0B0]` for inactive

## Files Updated

### Core Files (Completed)
- ✅ `tailwind.config.js` - Custom color palette added
- ✅ `src/index.css` - Base styles updated
- ✅ `src/App.jsx` - Root background updated
- ✅ `src/utils/theme.js` - Theme colors updated
- ✅ `src/pages/LoginPage.jsx` - Partially updated

### Files Requiring Updates

#### Authentication
- ⚠️ `src/pages/LoginPage.jsx` - Needs complete review
- ❌ `src/pages/RegisterPage.jsx` - Needs full update

#### Dashboards
- ❌ `src/pages/BusinessDashboard.jsx`
- ❌ `src/pages/CustomerDashboard.jsx`
- ❌ `src/pages/DriverDashboard.jsx`

#### Business Pages
- ❌ `src/pages/business/OverviewPage.jsx`
- ❌ `src/pages/business/FleetPage.jsx`
- ❌ `src/pages/business/DriversPage.jsx`
- ❌ `src/pages/business/DriverManagementPage.jsx`
- ❌ `src/pages/business/TripsPage.jsx`
- ❌ `src/pages/business/TripsListPage.jsx`
- ❌ `src/pages/business/PendingTripsPage.jsx`
- ❌ `src/pages/business/EnquiriesPage.jsx`
- ❌ `src/pages/business/CustomersPage.jsx`
- ❌ `src/pages/business/HirePage.jsx`
- ❌ `src/pages/business/ProfilePage.jsx`
- ❌ `src/pages/business/ReportsPage.jsx`

#### Customer Pages
- ❌ `src/pages/customer/VehiclesPage.jsx`
- ❌ `src/pages/customer/MyTripsPage.jsx`
- ❌ `src/pages/customer/EnquiriesPage.jsx`
- ❌ `src/pages/customer/ProfilePage.jsx`

#### Driver Pages
- ❌ `src/pages/driver/JobOffersPage.jsx`
- ❌ `src/pages/driver/DeliveriesPage.jsx`
- ❌ `src/pages/driver/RoutesPage.jsx`
- ❌ `src/pages/driver/EarningsPage.jsx`
- ❌ `src/pages/driver/VehicleInfoPage.jsx`
- ❌ `src/pages/driver/ProfilePage.jsx`

#### Components
- ❌ `src/components/ForgotPasswordModal.jsx`
- ❌ `src/components/PaymentModal.jsx`
- ❌ `src/components/ProfileModal.jsx`
- ❌ `src/components/SendEnquiryModal.jsx`

## Search & Replace Patterns (Regex)

Use these patterns in your editor for bulk replacements:

1. **Background Colors**
   ```
   Find: bg-gray-800|bg-\[#232323\]
   Replace: bg-[#1F1F1F]
   ```

2. **Primary Colors**
   ```
   Find: bg-primary-[0-9]+|bg-yellow-[0-9]+|bg-\[#FEEE00\]
   Replace: bg-[#FFC107]
   ```

3. **Text Gray**
   ```
   Find: text-gray-400
   Replace: text-[#B0B0B0]
   ```

4. **Border Colors**
   ```
   Find: border-gray-600
   Replace: border-[#1F1F1F]
   ```

## Validation Checklist

After updating each file, verify:

- [ ] All backgrounds use `#0D0D0D` or `#1F1F1F`
- [ ] All primary/accent colors use `#FFC107`
- [ ] All text uses white or `#B0B0B0`
- [ ] Success states use `#4CAF50`
- [ ] Error states use `#F44336`
- [ ] Buttons have proper hover/active states
- [ ] Cards have amber shadow effects
- [ ] Form inputs have amber focus rings
- [ ] Transitions are smooth (`transition-all duration-200 ease-in-out`)
- [ ] Contrast ratios meet accessibility standards

## Notes

- The `index.css` file already handles global input and button styling
- Theme utility functions in `theme.js` can be used instead of inline styles
- Maintain responsive design while updating colors
- Test all interactive states (hover, focus, active, disabled)
