import { MarketingNav } from './nav'
import { MarketingFooter } from './footer'
import { VapiWidget } from './vapi-widget'

export function MarketingLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <VapiWidget />
    </div>
  )
}
