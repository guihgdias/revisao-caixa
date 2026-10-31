import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const reviewFields = [
  { key: 'loyalty', id: 'review-loyalty', name: 'reviewLoyalty', label: 'Fidelidade' },
  { key: 'cardPix', id: 'review-card-pix', name: 'reviewCardPix', label: 'Cartão/Pix' },
  { key: 'cash', id: 'review-cash', name: 'reviewCash', label: 'Dinheiro' },
  { key: 'withdrawal', id: 'review-withdrawal', name: 'reviewWithdrawal', label: 'Saque' },
  { key: 'dailies', id: 'review-dailies', name: 'reviewDailies', label: 'Diárias' },
  { key: 'replenish', id: 'review-replenish', name: 'reviewReplenish', label: 'Repor fundo de caixa', subtracts: true },
]

const roles = [
  { value: 'Recepcionista', daily: '150' },
  { value: 'Camareira', daily: '140' },
  { value: 'Lavanderia', daily: '170' },
  { value: 'Gerência' },
  { value: 'Outro' },
]

const themes = [
  { id: 'default', label: 'Azul' },
  { id: 'orange', label: 'Laranja' },
  { id: 'red', label: 'Vermelho' },
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

function getWeekday(date) {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
  return `${weekday[0].toLocaleUpperCase('pt-BR')}${weekday.slice(1)}`
}

function formatDate(dateValue) {
  const date = parseDate(dateValue)
  if (!date) return dateValue
  return `${dateValue} - ${getWeekday(date)}`
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

function SunIcon({ className = 'shift-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className = 'shift-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  )
}

// Chaveiro de quarto: a marca do motel na barra do topo.
function KeyTagMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 32" aria-hidden="true" focusable="false">
      <path d="M12 1.5 21 7v18.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V7Z" />
      <circle cx="12" cy="8.5" r="2.2" />
      <path d="M8 17h8M8 21.5h5" />
    </svg>
  )
}

function SectionHeading({ title, description, id }) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  )
}

function AppearanceControls({ theme, setTheme, darkMode, setDarkMode }) {
  return (
    <div className="appearance-controls">
      <div className="theme-options" role="group" aria-label="Cor do tema">
        {themes.map((option) => (
          <button
            className={`theme-swatch theme-swatch-${option.id}`}
            key={option.id}
            type="button"
            aria-pressed={theme === option.id}
            aria-label={`Tema ${option.label}`}
            title={`Tema ${option.label}`}
            onClick={() => setTheme(option.id)}
          />
        ))}
      </div>
      <button
        className="mode-toggle"
        type="button"
        aria-pressed={darkMode}
        aria-label={darkMode ? 'Usar modo claro' : 'Usar modo escuro'}
        title={darkMode ? 'Usar modo claro' : 'Usar modo escuro'}
        onClick={() => setDarkMode((current) => !current)}
      >
        {darkMode ? <SunIcon className="mode-icon" /> : <MoonIcon className="mode-icon" />}
      </button>
    </div>
  )
}

function EmployeeCard({ employee, index, count, onChange, onRemove }) {
  const prefix = `employee-${employee.id}`
  const update = (field, value) => onChange(employee.id, { [field]: value })
  const selectedRole = roles.find((role) => role.value === employee.role)
  const fixedDaily = selectedRole?.daily
  const netPayable = Number(employee.daily) - Number(employee.advanceAmount || 0)

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
      <div className="employee-header">
        <span className="employee-title">
          {employee.name.trim() || `Pessoa ${index + 1}`}
        </span>
        <span className="employee-net">
          {employee.daily === ''
            ? <span className="value-missing">—</span>
            : <>{employee.paid ? 'Pago' : 'A pagar'} <strong className="num">{formatCurrency(netPayable)}</strong></>}
        </span>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${prefix}-role`}>Função</label>
          <select
            id={`${prefix}-role`}
            name="employeeRole[]"
            value={employee.role}
            onChange={handleRoleChange}
            required
          >
            <option value="">Selecione</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.value}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-name`}>Nome</label>
          <input
            id={`${prefix}-name`}
            name="employeeName[]"
            type="text"
            autoComplete="off"
            value={employee.name}
            onChange={(event) => update('name', event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-daily`}>Diária</label>
          <div className="money-input">
            <span aria-hidden="true">R$</span>
            <input
              className="num"
              id={`${prefix}-daily`}
              name="employeeDaily[]"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={employee.daily}
              readOnly={Boolean(fixedDaily)}
              onChange={(event) => update('daily', event.target.value)}
              required
            />
          </div>
          {fixedDaily && <p className="field-hint">Valor fixo para {employee.role.toLowerCase()}.</p>}
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

      <div className="employee-checks">
        <label className="check-option" htmlFor={`${prefix}-has-advance`}>
          <input
            id={`${prefix}-has-advance`}
            name="employeeHasAdvance[]"
            type="checkbox"
            checked={employee.hasAdvance}
            onChange={handleAdvanceToggle}
          />
          Pegou vale
        </label>
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

      {employee.hasAdvance && (
        <div className="field-grid">
          <div className="field">
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
          </div>
          <div className="field">
            <label htmlFor={`${prefix}-advance-amount`}>Valor do vale</label>
            <div className="money-input">
              <span aria-hidden="true">R$</span>
              <input
                className="num"
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
          </div>
        </div>
      )}

      {count > 1 && (
        <button
          className="text-button remove-employee"
          type="button"
          onClick={() => onRemove(employee.id)}
        >
          Remover {employee.name.trim() || `pessoa ${index + 1}`}
        </button>
      )}
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
    : null
  const parsedDate = parseDate(date)
  const shiftSummary = parsedDate && shift
    ? `${getWeekday(parsedDate)}, ${date} · Turno ${shift === 'Dia' ? 'do dia' : 'da noite'}`
    : 'Preencha a data e o turno para começar.'

  let balance = { label: 'Diferença do caixa', tone: 'pending', note: 'Informe o faturamento para comparar.' }
  if (revenue !== '') {
    const note = `Revisão ${formatCurrency(reviewTotal)} contra faturamento ${formatCurrency(revenueValue)}`
    if (difference > 0) balance = { label: 'Sobra no caixa', tone: 'positive', note }
    else if (difference < 0) balance = { label: 'Falta no caixa', tone: 'negative', note }
    else balance = { label: 'Caixa batendo', tone: 'zero', note }
  }

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
      setCopyStatus('Copiada. Agora é só colar no WhatsApp.')
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
        ? 'Copiada. Agora é só colar no WhatsApp.'
        : 'Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="brand">
            <KeyTagMark />
            <span className="brand-name">Bahrem Motel</span>
            <span className="brand-scope">Caixa</span>
          </div>
          <AppearanceControls
            theme={theme}
            setTheme={setTheme}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        </div>
      </header>

      <main className="page">
        <div className="title-row">
          <h1>Fechamento de turno</h1>
          <p className="title-note">{shiftSummary}</p>
        </div>

        <div className="layout">
          <form className="form" id="shift-form" onSubmit={handleSubmit} onChange={markReportStale}>
            <section className="panel" aria-labelledby="shift-section-title">
              <SectionHeading id="shift-section-title" title="Data e turno" />
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="shift-date">Data</label>
                  <input
                    className="num"
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
                        <span className="shift-hours num">07:00 às 19:00</span>
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
                        <span className="shift-hours num">19:00 às 07:00 do dia seguinte</span>
                      </span>
                    </label>
                  </div>
                </div>
              </fieldset>
            </section>

            <section className="panel" aria-labelledby="team-section-title">
              <SectionHeading
                id="team-section-title"
                title="Equipe"
                description="Quem trabalhou neste turno, com diária e vale de cada um."
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
              <button className="secondary-button add-employee" type="button" onClick={addEmployee}>
                Adicionar pessoa
              </button>
            </section>

            <section className="panel" aria-labelledby="numbers-section-title">
              <SectionHeading
                id="numbers-section-title"
                title="Movimento"
                description="O ticket médio é o faturamento dividido pelas saídas."
              />
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="car-exits">Saídas de carros</label>
                  <input
                    className="num"
                    id="car-exits"
                    name="carExits"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={carExits}
                    onChange={(event) => {
                      setCarExits(event.target.value)
                      markReportStale()
                    }}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="revenue">Faturamento</label>
                  <div className="money-input">
                    <span aria-hidden="true">R$</span>
                    <input
                      className="num"
                      id="revenue"
                      name="revenue"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={revenue}
                      onChange={(event) => {
                        setRevenue(event.target.value)
                        markReportStale()
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="panel" aria-labelledby="review-section-title">
              <SectionHeading
                id="review-section-title"
                title="Revisão do caixa"
                description="Valores conferidos na mão. Campo vazio conta como zero."
              />
              <div className="field-grid money-grid">
                {reviewFields.map((field) => (
                  <div className="field" key={field.key}>
                    <label htmlFor={field.id}>
                      {field.label}
                      {field.subtracts && <span className="label-note"> (subtrai)</span>}
                    </label>
                    <div className="money-input">
                      <span aria-hidden="true">R$</span>
                      <input
                        className="num"
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
                  </div>
                ))}
              </div>
            </section>
          </form>

          <aside className="summary" aria-labelledby="summary-title">
            <section className="panel summary-panel" aria-live="polite">
              <h2 id="summary-title" className="summary-label">{balance.label}</h2>
              <p className={`balance-value num balance-${balance.tone}`}>
                {revenue === '' ? '—' : formatSignedCurrency(difference)}
              </p>
              <p className="balance-note">{balance.note}</p>

              <dl className="summary-list">
                <div>
                  <dt>Saídas</dt>
                  <dd className="num">{carExits === '' ? <span className="value-missing">—</span> : exitsValue}</dd>
                </div>
                <div>
                  <dt>Faturamento</dt>
                  <dd className="num">{revenue === '' ? <span className="value-missing">—</span> : formatCurrency(revenueValue)}</dd>
                </div>
                <div>
                  <dt>Ticket médio</dt>
                  <dd className="num ticket-value">{averageTicket ?? <span className="value-missing">—</span>}</dd>
                </div>
                <div>
                  <dt>Total da revisão</dt>
                  <dd className="num">{formatCurrency(reviewTotal)}</dd>
                </div>
              </dl>

              <button className="primary-button" type="submit" form="shift-form">
                Gerar mensagem
              </button>
            </section>

            {report && (
              <section className="panel preview-panel" aria-labelledby="report-title" ref={reportRef}>
                <div className="preview-header">
                  <h2 id="report-title">Mensagem pronta</h2>
                  <button className="secondary-button" type="button" onClick={copyReport}>
                    Copiar
                  </button>
                </div>
                <p className="report-preview">{report}</p>
                <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
              </section>
            )}

            <p className="page-note">Nada fica salvo: ao fechar a página, os dados somem.</p>
          </aside>
        </div>
      </main>
    </>
  )
}

export default App
