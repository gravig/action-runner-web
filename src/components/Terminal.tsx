import ProductPreview from "./ProductPreview";
import TerminalPanel from "./TerminalPanel";

function Terminal() {
  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <div className="min-h-0 flex-[3]">
        <TerminalPanel />
      </div>

      <ProductPreview className="min-h-0 flex-1" />
    </div>
  );
}

export default Terminal;
