import { useParams } from 'react-router-dom';

function TransactionDetailPage() {
  const { id } = useParams();
  return <h1 className="text-2xl font-bold">Transaction {id}</h1>;
}

export default TransactionDetailPage;
