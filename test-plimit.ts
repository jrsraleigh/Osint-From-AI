import pLimit from 'p-limit';
console.log('pLimit type:', typeof pLimit);
try {
  const limit = pLimit(2);
  console.log('limit type:', typeof limit);
} catch (e) {
  console.error('Error calling pLimit:', e);
}
