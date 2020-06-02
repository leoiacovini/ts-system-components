export interface INode {
  id: string
  edges: string[]
}
const hasIncomingEdges = (node: INode) => node.edges.length
const noIncomingEdges = (node: INode) => !node.edges.length

const removeEdge = (adjacentVertex: string, node: INode) => {
  const newNode = Object.assign({}, node)
  newNode.edges = node.edges.filter((vertex) => vertex !== adjacentVertex)
  return newNode
}

export const topoSort = (nodes: INode[] = []) => {
  let noEdges = nodes.filter(noIncomingEdges)
  let withEdges = nodes.filter(hasIncomingEdges)
  const sorted = []

  while (noEdges.length) {
    const node = noEdges.pop()
    sorted.push(node)

    withEdges = withEdges.map(removeEdge.bind(null, node!.id))
    const newNoEdges = withEdges.filter(noIncomingEdges)
    noEdges = noEdges.concat(newNoEdges)

    withEdges = withEdges.filter(hasIncomingEdges)
  }
  return sorted.map((node) => node!.id)
}
