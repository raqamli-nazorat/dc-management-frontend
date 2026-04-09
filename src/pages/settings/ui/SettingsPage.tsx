import { Heading } from '@/shared/ui/Typography'
import { Card, CardBody, CardHeader } from '@/shared/ui/Card'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>Sozlamalar</Heading>
      <Card>
        <CardHeader>
          <span className="font-display text-base font-semibold text-ivory">Profil ma'lumotlari</span>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-silver">Sozlamalar bo'limi tez orada qo'shiladi.</p>
        </CardBody>
      </Card>
    </div>
  )
}
