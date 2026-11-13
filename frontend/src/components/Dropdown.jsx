import { Children, isValidElement, useEffect, useRef, useState } from "react";
import "../styles/dropdown.css";

function getText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) return value.map(getText).join("");
  if (isValidElement(value)) return getText(value.props.children);
  return "";
}

function getOptions(children, options) {
  if (options) {
    return options.map((option, index) => ({
      key: `${option.value}-${index}`,
      value: String(option.value),
      label: option.label,
      searchLabel: getText(option.label),
      disabled: Boolean(option.disabled),
    }));
  }

  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === "option")
    .map((option, index) => ({
      key: option.key || `${option.props.value}-${index}`,
      value:
        option.props.value === undefined
          ? getText(option.props.children)
          : String(option.props.value),
      label: option.props.children,
      searchLabel: getText(option.props.children),
      disabled: Boolean(option.props.disabled),
    }));
}

export default function Dropdown({
  value,
  onChange,
  options,
  children,
  placeholder = "Seleccione...",
  searchable = false,
  small = false,
  id,
  name,
  className = "",
  required = false,
  disabled = false,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [invalid, setInvalid] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const currentValue = value == null ? "" : String(value);
  const normalizedOptions = getOptions(children, options);
  const seleccionada = normalizedOptions.find(
    (option) => option.value === currentValue
  );
  const filtradas = searchable
    ? normalizedOptions.filter((option) =>
        option.searchLabel.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())
      )
    : normalizedOptions;

  useEffect(() => {
    const clickFuera = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const cerrarConEscape = (event) => {
      if (
        event.key === "Escape" &&
        ref.current?.contains(document.activeElement)
      ) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", clickFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", clickFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  const elegir = (selectedValue) => {
    const target = { name, value: selectedValue };
    onChange?.(options ? selectedValue : { target, currentTarget: target });
    setOpen(false);
    setBusqueda("");
    setInvalid(false);
  };

  const opcionesNativas = options
    ? normalizedOptions.map((option) => (
        <option key={option.key} value={option.value} disabled={option.disabled}>
          {option.searchLabel}
        </option>
      ))
    : children;

  return (
    <div
      ref={ref}
      className={`dd ${open ? "open" : ""} ${small ? "dd-sm" : ""} ${
        invalid ? "invalid" : ""
      } ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="dd-trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className={`dd-value ${seleccionada ? "" : "dd-placeholder"}`}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <svg
          className="dd-arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={id ? `${id}-listbox` : undefined}
          className="dd-panel"
          role="listbox"
        >
          {searchable && (
            <input
              autoFocus
              className="dd-search"
              placeholder="Buscar..."
              aria-label="Buscar opciones"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          )}

          {filtradas.length === 0 ? (
            <div className="dd-empty">Sin resultados</div>
          ) : (
            filtradas.map((option) => {
              const activo = option.value === currentValue;
              return (
                <button
                  type="button"
                  key={option.key}
                  role="option"
                  aria-selected={activo}
                  disabled={option.disabled}
                  className={`dd-option ${activo ? "selected" : ""}`}
                  onClick={() => elegir(option.value)}
                >
                  <span>{option.label}</span>
                  {activo && <span aria-hidden="true">✓</span>}
                </button>
              );
            })
          )}
        </div>
      )}

      {(required || name) && (
        <select
          className="dd-native"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
          onChange={(event) => elegir(event.target.value)}
          onInvalid={() => setInvalid(true)}
        >
          {opcionesNativas}
        </select>
      )}
    </div>
  );
}
