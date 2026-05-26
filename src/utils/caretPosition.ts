/**
 * Calculate the pixel position of the text cursor in a textarea
 * Used for positioning autocomplete dropdown
 */
export function getCaretCoordinates(
  element: HTMLTextAreaElement
): { top: number; left: number } {
  // Get textarea position in viewport
  const elementRect = element.getBoundingClientRect();

  // Create hidden mirror div with same styling
  const mirror = document.createElement('div');
  const computed = window.getComputedStyle(element);

  // Copy all computed styles to mirror
  const properties = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ];

  properties.forEach(prop => {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop));
  });

  // Position mirror at same location as textarea
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.overflow = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  // Set content up to cursor position
  const textBeforeCursor = element.value.substring(0, element.selectionStart);
  mirror.textContent = textBeforeCursor;

  // Add marker span at cursor position
  const marker = document.createElement('span');
  marker.textContent = '|';
  mirror.appendChild(marker);

  // Append to body temporarily
  document.body.appendChild(mirror);

  // Measure marker position within mirror
  const markerRect = marker.getBoundingClientRect();

  // Clean up
  document.body.removeChild(mirror);

  // Calculate viewport position: element position + marker position within mirror
  const paddingLeft = parseInt(computed.paddingLeft);
  const paddingTop = parseInt(computed.paddingTop);
  const borderLeft = parseInt(computed.borderLeftWidth);
  const borderTop = parseInt(computed.borderTopWidth);

  return {
    top: elementRect.top + borderTop + paddingTop + (markerRect.top - elementRect.top),
    left: elementRect.left + borderLeft + paddingLeft + (markerRect.left - elementRect.left)
  };
}
