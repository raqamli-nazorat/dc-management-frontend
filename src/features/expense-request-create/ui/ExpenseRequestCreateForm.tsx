import { CreditCard, DollarSign, FileText } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { useExpenseRequestCreateForm } from '../model/useExpenseRequestCreateForm'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Button } from '@/shared/ui/Button'

const CARD_TYPE_OPTIONS = [
  { value: '8600', label: 'Uzcard (8600...)' },
  { value: '9860', label: 'Humo (9860...)' },
  { value: '4000', label: 'Visa' },
  { value: '5000', label: 'Mastercard' },
]

export function ExpenseRequestCreateForm() {
  const { form, onSubmit, isPending } = useExpenseRequestCreateForm()
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form

  const cardType = watch('cardNumber')?.slice(0, 4) ?? ''

  function handleCardTypeChange(prefix: string) {
    const currentCard = form.getValues('cardNumber')
    const stripped = currentCard.replace(/\D/g, '').slice(4)
    setValue('cardNumber', prefix + stripped, { shouldValidate: true })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-pearl">
          <span className="flex items-center gap-2">
            <DollarSign size={14} className="text-silver" />
            Miqdor (UZS)
          </span>
        </label>
        <Input
          type="number"
          min={0}
          step={1000}
          placeholder="500 000"
          error={errors.amount?.message}
          {...register('amount')}
        />
        {!errors.amount && (
          <p className="text-xs text-silver">So'ralayotgan summa UZS da</p>
        )}
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-pearl">
          <span className="flex items-center gap-2">
            <FileText size={14} className="text-silver" />
            Sabab
          </span>
        </label>
        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={4}
              placeholder="Xarajat sababi va tafsilotlarini kiriting..."
              className={[
                'w-full resize-none rounded border bg-graphite px-3 py-2.5 text-sm text-ivory placeholder:text-silver',
                'border-smoke focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30',
                'transition-colors duration-150',
                errors.reason ? 'border-danger focus:border-danger focus:ring-danger/30' : '',
              ].join(' ')}
            />
          )}
        />
        {errors.reason && (
          <p className="text-xs text-danger">{errors.reason.message}</p>
        )}
        {!errors.reason && (
          <p className="text-xs text-silver">
            {(form.watch('reason') ?? '').length}/500
          </p>
        )}
      </div>

      {/* Card */}
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-pearl">
          <span className="flex items-center gap-2">
            <CreditCard size={14} className="text-silver" />
            To'lov kartasi
          </span>
        </label>

        <Select
          label="Karta turi"
          options={CARD_TYPE_OPTIONS}
          placeholder="Karta turini tanlang"
          value={
            CARD_TYPE_OPTIONS.find((o) => cardType.startsWith(o.value))?.value ?? ''
          }
          onChange={(e) => handleCardTypeChange(e.target.value)}
        />

        <Input
          label="Karta raqami"
          placeholder="8600 0000 0000 0000"
          maxLength={19}
          error={errors.cardNumber?.message}
          hint="16 ta raqam, probel bilan yozilishi mumkin"
          {...register('cardNumber')}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
            const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? ''
            form.setValue('cardNumber', formatted, { shouldValidate: true })
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-smoke pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => history.back()}
        >
          Bekor qilish
        </Button>
        <Button type="submit" loading={isPending}>
          So'rov yuborish
        </Button>
      </div>
    </form>
  )
}
