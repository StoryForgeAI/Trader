import { ResellToolPage } from '@/components/resell-tool-page';
import { IMAGE_ANALYSIS_COST } from '@/lib/catalog';

export default function ImageToAnalisisPage() {
  return <ResellToolPage mode="image" creditCost={IMAGE_ANALYSIS_COST} />;
}
