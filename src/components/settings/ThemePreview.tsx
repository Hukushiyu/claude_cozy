import { ThemeColors } from '../../types/theme';

interface ThemePreviewProps {
  colors: ThemeColors;
}

export function ThemePreview({ colors }: ThemePreviewProps) {
  return (
    <div
      className="rounded-lg p-4 border-2"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="mb-3">
        <h4 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
          Live Preview
        </h4>
        <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
          See how your theme will look
        </p>
      </div>

      {/* Sidebar and Chat preview */}
      <div className="flex gap-3 mb-3">
        {/* Sidebar with buttons */}
        <div
          className="w-24 rounded border p-2 space-y-2"
          style={{
            backgroundColor: colors.sidebarBg,
            borderColor: colors.border,
          }}
          title="Sidebar"
        >
          {/* Secondary button example */}
          <button
            className="w-full px-2 py-1 rounded-lg border text-xs"
            style={{
              backgroundColor: 'transparent',
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            Dropdown
          </button>
          {/* Text link example */}
          <div className="text-xs underline px-2" style={{ color: colors.text }}>
            Link
          </div>
          {/* Text overlay example */}
          <div className="text-xs px-2" style={{ color: colors.textSecondary }}>
            <div>Tokens:</div>
            <div className="font-mono" style={{ color: colors.text }}>12.5K</div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 space-y-2">
          <div
            className="text-xs px-3 py-2 rounded"
            style={{
              backgroundColor: colors.userBubble,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            User message
          </div>
          <div
            className="text-xs px-3 py-2 rounded"
            style={{
              backgroundColor: colors.assistantBubble,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            Assistant message
          </div>
        </div>
      </div>

      {/* Button examples */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs" style={{ color: colors.textSecondary }}>Primary:</span>
          <button
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: colors.accent,
              color: '#FFFFFF',
            }}
          >
            Settings
          </button>
          <button
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: colors.accentHover,
              color: '#FFFFFF',
            }}
          >
            Hover
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs" style={{ color: colors.textSecondary }}>Secondary:</span>
          <button
            className="px-3 py-1 rounded-lg border text-xs"
            style={{
              backgroundColor: 'transparent',
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            Skills
          </button>
          <button
            className="px-3 py-1 rounded-lg text-xs"
            style={{
              backgroundColor: colors.hover,
              color: colors.text,
            }}
          >
            Hover
          </button>
        </div>
      </div>
    </div>
  );
}
