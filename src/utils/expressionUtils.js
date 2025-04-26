/**
 * Convierte un array de tokens en una expresión de cadena
 */
export function tokensToExpression(tokens) {
  return tokens
    .filter(item => item.type !== 'empty' && !item.disabled)
    .map(item => item.data)
    .join(' ');
}