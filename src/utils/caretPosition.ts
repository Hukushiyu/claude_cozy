/**
 * Calculate the pixel position of the text cursor in a textarea
 * Used for positioning autocomplete dropdown
 */
export function getCaretCoordinates(
  element: HTMLTextAreaElement
): { top: number; left: number } {
  // Get textarea position in viewport
  const elementRect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  // Create hidden mirror div with same styling
  const mirror = document.createElement('div');

  // Copy text styles
  const properties = [
    'boxSizing',
    'width',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontSize',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textIndent',
    'letterSpacing',
    'wordSpacing',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ];

  properties.forEach(prop => {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop));
  });

  // Position mirror off-screen but visible
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '0';

  // Set content up to cursor position
  const textBeforeCursor = element.value.substring(0, element.selectionStart);
  mirror.textContent = textBeforeCursor;

  // Add marker span at cursor position
  const marker = document.createElement('span');
  marker.textContent = '|';
  mirror.appendChild(marker);

  // Append to body
  document.body.appendChild(mirror);

  // Get marker position relative to mirror
  const markerOffsetTop = marker.offsetTop;
  const markerOffsetLeft = marker.offsetLeft;

  // Clean up
  document.body.removeChild(mirror);

  // Calculate viewport position
  const paddingLeft = parseInt(computed.paddingLeft) || 0;
  const paddingTop = parseInt(computed.paddingTop) || 0;
  const borderLeft = parseInt(computed.borderLeftWidth) || 0;
  const borderTop = parseInt(computed.borderTopWidth) || 0;

  return {
    top: elementRect.top + borderTop + paddingTop + markerOffsetTop,
    left: elementRect.left + borderLeft + paddingLeft + markerOffsetLeft
  };
}
