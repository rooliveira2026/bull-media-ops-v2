export function currency(value: number, code = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function number(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

export function decimal(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function percent(value: number) {
  return `${decimal(value * 100, 1)}%`;
}
