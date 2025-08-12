// Utility function to get dashboard route based on user role
export const getDashboardRoute = (userRole) => {
  switch (userRole) {
    case 'business':
      return '/dashboard/business'
    case 'driver':
      return '/dashboard/driver'
    case 'customer':
      return '/dashboard/customer'
    default:
      console.warn('Unknown user role:', userRole)
      return '/'
  }
}

// Utility function to redirect user to appropriate dashboard
export const redirectToDashboard = (userRole, navigate) => {
  const route = getDashboardRoute(userRole)
  console.log('Redirecting user to dashboard:', userRole, '→', route)
  navigate(route)
}
