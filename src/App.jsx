import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const reviewFields = [
  { key: 'loyalty', id: 'review-loyalty', name: 'reviewLoyalty', label: 'Fidelidade (R$)' },
  { key: 'cardPix', id: 'review-card-pix', name: 'reviewCardPix', label: 'Cartão/Pix (R$)' },
  { key: 'cash', id: 'review-cash', name: 'reviewCash', label: 'Dinheiro (R$)' },
  { key: 'withdrawal', id: 'review-withdrawal', name: 'reviewWithdrawal', label: 'Saque (R$)' },
  { key: 'dailies', id: 'review-dailies', name: 'reviewDailies', label: 'Diárias (R$)' },
  { key: 'replenish', id: 'review-replenish', name: 'reviewReplenish', label: 'Repor fundo de caixa (R$)' },
]

const roles = [
  { value: 'Recepcionista', daily: '150' },
  { value: 'Camareira', daily: '140' },
  { value: 'Lavanderia', daily: '170' },
  { value: 'Gerência' },
  { value: 'Outro' },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

let nextEmployeeId = 0

function createEmployee() {
  return {
    id: `employee-${++nextEmployeeId}`,
    role: '',
    name: '',
    daily: '',
    payment: '',
    hasAdvance: false,
    advanceDescription: '',
    advanceAmount: '',
    paid: false,
  }
}

function formatCurrency(value) {
  return currencyFormatter.format(value)
}

function formatSignedCurrency(value) {
  const sign = value < 0 ? '-' : '+'
  return `${sign}${formatCurrency(Math.abs(value))}`
}

function parseDate(dateValue) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return null

  const [day, month, year] = dateValue.split('/').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function formatDate(dateValue) {
  const date = parseDate(dateValue)
  if (!date) return dateValue

  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
  const capitalizedWeekday = `${weekday[0].toLocaleUpperCase('pt-BR')}${weekday.slice(1)}`
  return `${dateValue} - ${capitalizedWeekday}`
}

function calculateReviewTotal(review) {
  return (
    review.loyalty +
    review.cardPix +
    review.cash +
    review.withdrawal +
    review.dailies -
    review.replenish
  )
}

function buildReport({ date, shift, employees, carExits, revenue, review }) {
  const ticket = carExits > 0
    ? formatCurrency(revenue / carExits)
    : 'Não definido (sem saídas)'
  const reviewTotal = calculateReviewTotal(review)
  const reviewDifference = reviewTotal - revenue
  const team = employees.map((employee) => {
    const netPayable = Number(employee.daily) - Number(employee.advanceAmount || 0)
    const advanceLine = employee.hasAdvance
      ? `Vale: ${employee.advanceDescription.trim()} — ${formatCurrency(Number(employee.advanceAmount))}`
      : 'Vale: Não teve'
    const situation = employee.paid ? 'Pago' : 'A pagar'

    return [
      `*${employee.role}: ${employee.name.trim()}*`,
      advanceLine,
      `Situação: ${situation} — ${formatCurrency(netPayable)} ${employee.paid ? 'no' : 'em'} ${employee.payment}`,
    ].join('\n')
  }).join('\n\n')

  return [
    '🏨 *FECHAMENTO DE TURNO*',
    `📅 *Data:* ${formatDate(date)}`,
    `${shift === 'Dia' ? '☀️' : '🌙'} *Turno:* ${shift} (${shift === 'Dia' ? '07:00 às 19:00' : '19:00 às 07:00 do dia seguinte'})`,
    '',
    '👥 *Equipe*',
    team,
    '',
    '📊 *Movimento*',
    `Saídas: ${carExits}`,
    `Faturamento: ${formatCurrency(revenue)}`,
    `Ticket médio: ${ticket}`,
    '',
    '🧾 *Revisão*',
    `Fidelidade: ${formatCurrency(review.loyalty)} (${carExits > 0 ? `${formatCurrency(review.loyalty / carExits)} por suíte` : '— por suíte'})`,
    `Cartão/Pix: ${formatCurrency(review.cardPix)}`,
    `Dinheiro: ${formatCurrency(review.cash)}`,
    `Saque: ${formatCurrency(review.withdrawal)}`,
    `Diárias: ${formatCurrency(review.dailies)}`,
    `Repor fundo de caixa: ${formatCurrency(review.replenish)}`,
    '',
    `*📌 Total: ${formatCurrency(reviewTotal)} (${formatSignedCurrency(reviewDifference)})*`,
  ].join('\n')
}

function SectionHeading({ number, title, description, id }) {
  return (
    <div className="section-heading">
      <span className="section-number" aria-hidden="true">{number}</span>
      <div>
        <h2 id={id}>{title}</h2>
        <p className="section-description">{description}</p>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg className="shift-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="shift-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  )
}

function ThemeControls({ theme, setTheme, darkMode, setDarkMode }) {
  const options = [
    { id: 'default', label: 'Padrão' },
    { id: 'orange', label: 'Laranja' },
    { id: 'red', label: 'Vermelho' },
  ]

  return (
    <div className="appearance-controls" aria-label="Aparência da página">
      <div className="theme-options" role="group" aria-label="Cor do tema">
        {options.map((option) => (
          <button
            className="theme-option"
            key={option.id}
            type="button"
            aria-pressed={theme === option.id}
            onClick={() => setTheme(option.id)}
          >
            <span className={`theme-swatch theme-swatch-${option.id}`} aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>
      <button
        className="mode-toggle"
        type="button"
        aria-pressed={darkMode}
        onClick={() => setDarkMode((current) => !current)}
      >
        <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
        <span>{darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}</span>
      </button>
    </div>
  )
}

function EmployeeCard({ employee, index, count, onChange, onRemove }) {
  const prefix = `employee-${employee.id}`
  const update = (field, value) => onChange(employee.id, { [field]: value })
  const selectedRole = roles.find((role) => role.value === employee.role)
  const fixedDaily = selectedRole?.daily

  function handleRoleChange(event) {
    const role = roles.find((item) => item.value === event.target.value)
    onChange(employee.id, {
      role: event.target.value,
      daily: role?.daily || '',
    })
  }

  function handleAdvanceToggle(event) {
    const hasAdvance = event.target.checked
    onChange(employee.id, {
      hasAdvance,
      advanceDescription: hasAdvance ? employee.advanceDescription : '',
      advanceAmount: hasAdvance ? employee.advanceAmount : '',
    })
  }

  return (
    <div className="employee-row">
      <div className="employee-top-grid">
        <div className="employee-role">
          <label htmlFor={`${prefix}-role`}>Função</label>
          <select
            id={`${prefix}-role`}
            name="employeeRole[]"
            value={employee.role}
            onChange={handleRoleChange}
            required
          >
            <option value="">Selecione a função</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.value}</option>
            ))}
          </select>
        </div>
        <div className="employee-name">
          <label htmlFor={`${prefix}-name`}>Nome do funcionário</label>
          <input
            className="employee-name-input"
            id={`${prefix}-name`}
            name="employeeName[]"
            type="text"
            autoComplete="off"
            placeholder="Nome do funcionário"
            value={employee.name}
            onChange={(event) => update('name', event.target.value)}
            required
          />
        </div>
      </div>

      <div className="employee-pay-grid">
        <div className="field">
          <label htmlFor={`${prefix}-daily`}>Diária (R$)</label>
          <input
            id={`${prefix}-daily`}
            name="employeeDaily[]"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Valor da diária"
            value={employee.daily}
            readOnly={Boolean(fixedDaily)}
            onChange={(event) => update('daily', event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-payment`}>Forma de pagamento</label>
          <select
            id={`${prefix}-payment`}
            name="employeePayment[]"
            value={employee.payment}
            onChange={(event) => update('payment', event.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
      </div>

      <div className="employee-pay-grid">
        <div className="field">
          <span className="field-label">Vale</span>
          <label className="check-option" htmlFor={`${prefix}-has-advance`}>
            <input
              id={`${prefix}-has-advance`}
              name="employeeHasAdvance[]"
              type="checkbox"
              checked={employee.hasAdvance}
              onChange={handleAdvanceToggle}
            />
            Teve vale
          </label>
        </div>
        {employee.hasAdvance && (
          <div className="field employee-advance-fields">
            <label htmlFor={`${prefix}-advance-description`}>Descrição do vale</label>
            <input
              id={`${prefix}-advance-description`}
              name="employeeAdvanceDescription[]"
              type="text"
              placeholder="Ex.: adiantamento"
              value={employee.advanceDescription}
              onChange={(event) => update('advanceDescription', event.target.value)}
              required
            />
            <label htmlFor={`${prefix}-advance-amount`}>Valor do vale (R$)</label>
            <input
              id={`${prefix}-advance-amount`}
              name="employeeAdvanceAmount[]"
              type="number"
              min="0.01"
              max={employee.daily || undefined}
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              value={employee.advanceAmount}
              onChange={(event) => update('advanceAmount', event.target.value)}
              required
            />
          </div>
        )}
      </div>

      <div className="employee-bottom-grid">
        <div className="field">
          <span className="field-label">Pagamento da diária</span>
          <label className="check-option" htmlFor={`${prefix}-paid`}>
            <input
              id={`${prefix}-paid`}
              name="employeePaid[]"
              type="checkbox"
              checked={employee.paid}
              onChange={(event) => update('paid', event.target.checked)}
            />
            Diária já recebida
          </label>
        </div>
        <button
          className="remove-employee"
          type="button"
          aria-label={`Remover funcionário ${index + 1}`}
          disabled={count === 1}
          onClick={() => onRemove(employee.id)}
        >
          ×
        </button>
      </div>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState('default')
  const [darkMode, setDarkMode] = useState(false)
  const [employees, setEmployees] = useState(() => [createEmployee()])
  const [date, setDate] = useState('')
  const [shift, setShift] = useState('')
  const [carExits, setCarExits] = useState('')
  const [revenue, setRevenue] = useState('')
  const [review, setReview] = useState({
    loyalty: '',
    cardPix: '',
    cash: '',
    withdrawal: '',
    dailies: '',
    replenish: '',
  })
  const [report, setReport] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const dateInputRef = useRef(null)
  const reportRef = useRef(null)

  const exitsValue = Number(carExits) || 0
  const revenueValue = Number(revenue) || 0
  const reviewValues = useMemo(
    () => Object.fromEntries(Object.entries(review).map(([key, value]) => [key, Number(value) || 0])),
    [review],
  )
  const reviewTotal = calculateReviewTotal(reviewValues)
  const difference = reviewTotal - revenueValue
  const averageTicket = carExits !== '' && revenue !== '' && exitsValue > 0
    ? formatCurrency(revenueValue / exitsValue)
    : '—'

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.mode = darkMode ? 'dark' : 'light'
  }, [theme, darkMode])

  function markReportStale() {
    if (report) setReport('')
    if (copyStatus) setCopyStatus('')
  }

  function updateEmployee(id, updates) {
    setEmployees((current) => current.map((employee) => (
      employee.id === id ? { ...employee, ...updates } : employee
    )))
    markReportStale()
  }

  function addEmployee() {
    setEmployees((current) => [...current, createEmployee()])
    markReportStale()
  }

  function removeEmployee(id) {
    setEmployees((current) => current.length > 1
      ? current.filter((employee) => employee.id !== id)
      : current)
    markReportStale()
  }

  function updateReview(key, value) {
    setReview((current) => ({ ...current, [key]: value }))
    markReportStale()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const dateIsValid = parseDate(date) !== null
    dateInputRef.current.setCustomValidity(
      dateIsValid || date === '' ? '' : 'Digite uma data válida no formato DD/MM/AAAA.',
    )
    if (!event.currentTarget.reportValidity()) return

    const preview = buildReport({
      date,
      shift,
      employees,
      carExits: exitsValue,
      revenue: revenueValue,
      review: reviewValues,
    })
    setReport(preview)
    setCopyStatus('')
    window.requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report)
      setCopyStatus('Prévia copiada! Agora é só colar no WhatsApp.')
    } catch {
      let copied = false
      const temporaryTextArea = document.createElement('textarea')
      temporaryTextArea.value = report
      temporaryTextArea.setAttribute('readonly', '')
      temporaryTextArea.style.position = 'fixed'
      temporaryTextArea.style.opacity = '0'
      document.body.append(temporaryTextArea)
      temporaryTextArea.select()
      try {
        copied = document.execCommand('copy')
      } finally {
        temporaryTextArea.remove()
      }

      setCopyStatus(copied
        ? 'Prévia copiada! Agora é só colar no WhatsApp.'
        : 'Não foi possível copiar. Selecione e copie a prévia manualmente.')
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Controle de turnos</p>
          <h1>Fechamento de turno</h1>
          <p>Registre a equipe e os principais números do período.</p>
        </div>
        <ThemeControls
          theme={theme}
          setTheme={setTheme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      </header>

      <form className="form-card" id="shift-form" onSubmit={handleSubmit} onChange={markReportStale}>
        <section className="form-section" aria-labelledby="shift-section-title">
          <SectionHeading
            number="1"
            id="shift-section-title"
            title="Data e turno"
            description="Informe a data de referência e o período do fechamento."
          />
          <div className="field-grid">
            <div className="field">
              <label htmlFor="shift-date">Data</label>
              <input
                ref={dateInputRef}
                id="shift-date"
                name="date"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                pattern="\d{2}/\d{2}/\d{4}"
                maxLength="10"
                title="Digite a data no formato dia/mês/ano (DD/MM/AAAA)"
                autoComplete="off"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value)
                  event.target.setCustomValidity('')
                  markReportStale()
                }}
                required
              />
            </div>
          </div>

          <fieldset className="shift-field">
            <legend className="field-label">Turno</legend>
            <div className="shift-options">
              <div className="shift-option">
                <input
                  id="shift-day"
                  name="shift"
                  type="radio"
                  value="Dia"
                  checked={shift === 'Dia'}
                  onChange={(event) => setShift(event.target.value)}
                  required
                />
                <label htmlFor="shift-day">
                  <SunIcon />
                  <span className="shift-text">
                    <span className="shift-name">Dia</span>
                    <span className="shift-hours">07:00 às 19:00</span>
                  </span>
                </label>
              </div>
              <div className="shift-option">
                <input
                  id="shift-night"
                  name="shift"
                  type="radio"
                  value="Noite"
                  checked={shift === 'Noite'}
                  onChange={(event) => setShift(event.target.value)}
                />
                <label htmlFor="shift-night">
                  <MoonIcon />
                  <span className="shift-text">
                    <span className="shift-name">Noite</span>
                    <span className="shift-hours">19:00 às 07:00 do dia seguinte</span>
                  </span>
                </label>
              </div>
            </div>
          </fieldset>
        </section>

        <section className="form-section" aria-labelledby="team-section-title">
          <SectionHeading
            number="2"
            id="team-section-title"
            title="Equipe do turno"
            description="Adicione cada pessoa que trabalhou neste período."
          />
          <div className="employee-list">
            {employees.map((employee, index) => (
              <EmployeeCard
                employee={employee}
                index={index}
                count={employees.length}
                key={employee.id}
                onChange={updateEmployee}
                onRemove={removeEmployee}
              />
            ))}
          </div>
          <button className="secondary-button" type="button" onClick={addEmployee}>
            + Adicionar funcionário
          </button>
        </section>

        <section className="form-section" aria-labelledby="numbers-section-title">
          <SectionHeading
            number="3"
            id="numbers-section-title"
            title="Movimento do turno"
            description="O ticket médio será calculado pelo faturamento dividido pelas saídas."
          />
          <div className="field-grid">
            <div className="field metric-field">
              <label htmlFor="car-exits">Fluxo de carros (saídas)</label>
              <input
                id="car-exits"
                name="carExits"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Ex.: 25"
                value={carExits}
                onChange={(event) => {
                  setCarExits(event.target.value)
                  markReportStale()
                }}
                required
              />
              <span className="input-suffix">saídas</span>
            </div>
            <div className="field">
              <label htmlFor="revenue">Faturamento do turno</label>
              <input
                id="revenue"
                name="revenue"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex.: 3250,00"
                value={revenue}
                onChange={(event) => {
                  setRevenue(event.target.value)
                  markReportStale()
                }}
                required
              />
            </div>
          </div>
          <div className="ticket-card" aria-live="polite">
            <span>Ticket médio</span>
            <output className="ticket-value" htmlFor="car-exits revenue">{averageTicket}</output>
          </div>
          <p className="help-text">Cálculo: faturamento ÷ saídas. Com zero saídas, o ticket médio não é definido.</p>
        </section>

        <section className="form-section" aria-labelledby="review-section-title">
          <SectionHeading
            number="4"
            id="review-section-title"
            title="Revisão do turno"
            description="Informe os valores conferidos manualmente. Os campos vazios contam como zero."
          />
          <div className="field-grid">
            {reviewFields.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={field.id}>{field.label}</label>
                <input
                  id={field.id}
                  name={field.name}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={review[field.key]}
                  onChange={(event) => updateReview(field.key, event.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="review-summary" aria-live="polite">
            <div className="review-summary-row">
              <span>Total da revisão</span>
              <output>{formatCurrency(reviewTotal)}</output>
            </div>
            <div className="review-summary-row">
              <span>Total da revisão − faturamento</span>
              <output className={revenue === '' ? '' : difference >= 0 ? 'difference-positive' : 'difference-negative'}>
                {revenue === '' ? '—' : formatSignedCurrency(difference)}
              </output>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button className="primary-button" type="submit">Gerar prévia do turno</button>
        </div>
      </form>

      {report && (
        <section className="preview-card" aria-labelledby="report-title" ref={reportRef}>
          <div className="preview-header">
            <h2 id="report-title">Prévia do fechamento</h2>
            <button className="secondary-button copy-button" type="button" onClick={copyReport}>
              Copiar prévia
            </button>
          </div>
          <pre className="report-preview">{report}</pre>
          <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
        </section>
      )}
      <p className="help-text page-note">Prévia local: os dados ainda não são salvos.</p>
    </main>
  )
}

export default App
