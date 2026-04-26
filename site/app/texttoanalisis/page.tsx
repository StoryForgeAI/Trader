import { ResellToolPage } from '@/components/resell-tool-page';
import { TEXT_ANALYSIS_COST } from '@/lib/catalog';

export default function TextToAnalisisPage() {
  return <ResellToolPage mode="text" creditCost={TEXT_ANALYSIS_COST} />;
}
