import { ERPProvider } from '@/store/ERPProvider'
import { StaffAssignmentProvider } from '@/context/StaffAssignmentContext'
import { EventExtendedProvider } from '@/context/EventExtendedContext'
import { ToastProvider } from '@/context/ToastContext'
import { AdminCatalogProvider } from '@/context/AdminCatalogContext'
import { ClientesCatalogProvider } from '@/context/ClientesCatalogContext'
import { SalesDataProvider } from '@/context/SalesDataContext'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <ERPProvider>
      <ToastProvider>
        <AdminCatalogProvider>
          <ClientesCatalogProvider>
            <SalesDataProvider>
              <StaffAssignmentProvider>
                <EventExtendedProvider>
                  <AppRoutes />
                </EventExtendedProvider>
              </StaffAssignmentProvider>
            </SalesDataProvider>
          </ClientesCatalogProvider>
        </AdminCatalogProvider>
      </ToastProvider>
    </ERPProvider>
  )
}
