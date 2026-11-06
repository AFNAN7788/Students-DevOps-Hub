import { useState, useId, useRef } from "react";

export default function Tabs({ children, defaultValue, className = "", ariaLabel = "Sections" }) {
  const panels = Array.isArray(children) ? children : [children];
  const [active, setActive] = useState(defaultValue || panels[0]?.props?.value);
  const baseId = useId();
  const tabRefs = useRef({});

  const handleKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % panels.length;
    if (e.key === "ArrowLeft") next = (index - 1 + panels.length) % panels.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = panels.length - 1;
    if (next !== null) {
      e.preventDefault();
      const nextValue = panels[next].props.value;
      setActive(nextValue);
      tabRefs.current[nextValue]?.focus();
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1 border-b border-navy-200 mb-6">
        {panels.map((child, index) => {
          const value = child.props.value;
          const isActive = active === value;
          return (
            <button
              key={value}
              ref={(el) => (tabRefs.current[value] = el)}
              role="tab"
              id={`${baseId}-tab-${value}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${value}`}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => setActive(value)}
              className={`-mb-px px-4 py-3 text-sm font-medium transition-colors border-b-2 rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive
                  ? "border-primary-500 text-primary-300 bg-primary-500/5"
                  : "border-transparent text-slate-400 hover:bg-navy-100/30 hover:text-slate-200"
              }`}
            >
              {child.props.label}
            </button>
          );
        })}
      </div>
      {panels.map((child) => {
        const value = child.props.value;
        return (
          <div
            key={value}
            role="tabpanel"
            id={`${baseId}-panel-${value}`}
            aria-labelledby={`${baseId}-tab-${value}`}
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
            hidden={active !== value}
          >
            {child.props.children}
          </div>
        );
      })}
    </div>
  );
}

// Purely declarative: Tabs only reads label/value/children off the element —
// nothing is rendered into the DOM from this component itself.
export const TabPanel = () => null;
TabPanel.displayName = "TabPanel";
