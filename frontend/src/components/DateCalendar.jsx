import { useMemo, useState } from "react";

const WEEKDAYS = [
  ["L", "Lunes"],
  ["M", "Martes"],
  ["X", "Miércoles"],
  ["J", "Jueves"],
  ["V", "Viernes"],
  ["S", "Sábado"],
  ["D", "Domingo"],
];

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2020, month, 1).toLocaleDateString("es-CO", { month: "long" })
);

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseISODate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthKey(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

export default function DateCalendar({
  value,
  onChange,
  min,
  max,
  availableDates,
  isDateAllowed = () => true,
  ariaLabel = "Seleccionar fecha",
}) {
  const availableSet = useMemo(
    () => (availableDates ? new Set(availableDates) : null),
    [availableDates]
  );
  const dates = availableDates?.length ? availableDates : [];
  const minDate = dates.length ? dates[dates.length - 1] : min;
  const maxDate = dates.length ? dates[0] : max;
  const [monthOverride, setMonthOverride] = useState(null);
  const selectedMonth = parseISODate(value);
  const visibleMonth =
    monthOverride?.value === value
      ? monthOverride.date
      : selectedMonth || new Date();

  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  );
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0
  ).getDate();
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const monthStart = monthKey(firstDay);
  const previousMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1
  );
  const nextMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    1
  );
  const minMonth = minDate ? monthKey(parseISODate(minDate)) : null;
  const maxMonth = maxDate ? monthKey(parseISODate(maxDate)) : null;
  const visibleYear = visibleMonth.getFullYear();
  const minYear = minDate
    ? Math.min(parseISODate(minDate).getFullYear(), visibleYear)
    : new Date().getFullYear() - 10;
  const maxYear = maxDate
    ? Math.max(parseISODate(maxDate).getFullYear(), visibleYear)
    : new Date().getFullYear() + 10;

  function changeVisibleMonth(year, month) {
    let targetMonth = month;
    const targetKey = year * 12 + targetMonth;

    if (minMonth !== null && targetKey < minMonth) {
      targetMonth = parseISODate(minDate).getMonth();
    } else if (maxMonth !== null && targetKey > maxMonth) {
      targetMonth = parseISODate(maxDate).getMonth();
    }

    setMonthOverride({ value, date: new Date(year, targetMonth, 1) });
  }

  function selectDay(day) {
    const selected = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );
    const isoDate = toISODate(selected);

    if (minDate && isoDate < minDate) return;
    if (maxDate && isoDate > maxDate) return;
    if ((availableSet && !availableSet.has(isoDate)) || !isDateAllowed(isoDate)) {
      return;
    }

    setMonthOverride(null);
    onChange(isoDate);
  }

  return (
    <div className="date-calendar" role="group" aria-label={ariaLabel}>
      <div className="date-calendar__header">
        <button
          type="button"
          className="date-calendar__month-nav"
          aria-label="Mes anterior"
          disabled={minMonth !== null && monthKey(previousMonth) < minMonth}
          onClick={() => setMonthOverride({ value, date: previousMonth })}
        >
          ‹
        </button>
        <div className="date-calendar__selectors">
          <select
            className="date-calendar__select"
            aria-label="Seleccionar mes"
            value={visibleMonth.getMonth()}
            onChange={(event) =>
              changeVisibleMonth(visibleYear, Number(event.target.value))
            }
          >
            {MONTHS.map((month, index) => {
              const key = visibleYear * 12 + index;

              return (
                <option
                  key={month}
                  value={index}
                  disabled={
                    (minMonth !== null && key < minMonth) ||
                    (maxMonth !== null && key > maxMonth)
                  }
                >
                  {month}
                </option>
              );
            })}
          </select>
          <select
            className="date-calendar__select date-calendar__year"
            aria-label="Seleccionar año"
            value={visibleYear}
            onChange={(event) =>
              changeVisibleMonth(
                Number(event.target.value),
                visibleMonth.getMonth()
              )
            }
          >
            {Array.from(
              { length: maxYear - minYear + 1 },
              (_, index) => minYear + index
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="date-calendar__month-nav"
          aria-label="Mes siguiente"
          disabled={maxMonth !== null && monthKey(nextMonth) > maxMonth}
          onClick={() => setMonthOverride({ value, date: nextMonth })}
        >
          ›
        </button>
      </div>

      <div className="date-calendar__grid" aria-label={ariaLabel}>
        {WEEKDAYS.map(([shortName, fullName]) => (
          <span
            className="date-calendar__weekday"
            key={fullName}
            aria-label={fullName}
          >
            {shortName}
          </span>
        ))}

        {Array.from({ length: leadingDays }, (_, index) => (
          <span
            className="date-calendar__empty"
            key={`empty-${monthStart}-${index}`}
            aria-hidden="true"
          />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth(),
            day
          );
          const isoDate = toISODate(date);
          const outsideBounds =
            (minDate && isoDate < minDate) || (maxDate && isoDate > maxDate);
          const isAvailable = !availableSet || availableSet.has(isoDate);
          const isAllowed = isDateAllowed(isoDate);
          const disabled = outsideBounds || !isAvailable || !isAllowed;
          const isSelected = isoDate === value;
          const isToday = isoDate === toISODate(new Date());

          return (
            <button
              type="button"
              className={[
                "date-calendar__day",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
                isAvailable && !disabled ? "is-available" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={isoDate}
              aria-label={date.toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="date-calendar__selection">
          Seleccionada:{" "}
          <strong>
            {parseISODate(value).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </p>
      )}
    </div>
  );
}
