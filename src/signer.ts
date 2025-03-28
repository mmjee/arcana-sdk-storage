import { Contract, BigNumber, Signer, ContractTransaction } from 'ethers'

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'method', type: 'string' }
]

const RequestTemplate = [
  { name: 'tx', type: 'ForwardRequest' }
  // will be decided dynamically based
]

function capitalize (method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1)
}

const typedData = (contract: Contract, method: string, complexType?: string[]) => {
  const fragment = contract.interface.getFunction(method)
  const result = []
  for (const input of fragment.inputs) {
    let { name, type } = input

    if (type === 'tuple' && !!complexType) {
      type = complexType[0]
      complexType.shift()
    }

    result.push({ name, type })
  }

  return result
}

const typedMessageInstance = (contract: Contract, method: string, params: any[]) => {
  const fragment = contract.interface.getFunction(method)

  const result: any = {}

  for (let i = 0; i < params.length; i++) {
    result[fragment.inputs[i].name] = BigNumber.isBigNumber(params[i]) ? +params[i] : params[i]
  }

  return result
}

function getMetaTxTypeData (chainId: number, verifyingContract: string, method: string, arcana: Contract) {
  const Request = [...RequestTemplate]

  // check need to push or unshift
  // According to EIP712, Alphabetically arrange the type
  const customType = capitalize(method)
  if (Request[0].type.charAt(0) > customType.charAt(0)) Request.unshift({ name: 'details', type: customType })
  else Request.push({ name: 'details', type: customType })

  const mtypedata: any = {
    types: {
      EIP712Domain,
      ForwardRequest,
      Request
    },
    domain: {
      name: 'Arcana Forwarder',
      version: '0.0.1',
      chainId,
      verifyingContract
    },
    primaryType: 'Request'
  }

  mtypedata.types[capitalize(method)] = typedData(arcana, method)

  return mtypedata
}

async function signTypedData (signer: any, from: string, data: any): Promise<string> {
  const [method, argData] = ['eth_signTypedData_v4', JSON.stringify(data)]
  return await signer.provider.send(method, [from, argData])
}

async function buildRequest (forwarder: Contract, input: any) {
  const nonce = await forwarder.getNonce(input.from).then((nonce: { toString: () => any }) => nonce.toString())
  return { nonce, ...input }
}

async function buildTypedData (forwarder: Contract, request: any, arcana: Contract, params: any[]): Promise<any> {
  const chainId = await forwarder.provider.getNetwork().then((n: { chainId: number }) => n.chainId)
  const typeData = getMetaTxTypeData(chainId, forwarder.address, request.method, arcana)

  // forward request
  typeData.message = {
    tx: {
      ...request
    }
  }

  typeData.message.tx.method = capitalize(request.method)

  typeData.message.details = typedMessageInstance(arcana, request.method, params)

  return typeData
}

async function signMetaTxRequest (signer: Signer, forwarder: Contract, arcana: Contract, params: any[], input: any) {
  const request = await buildRequest(forwarder, input)
  const toSign = await buildTypedData(forwarder, request, arcana, params)
  const signature = await signTypedData(signer, input.from, toSign)
  return { request, signature }
}

// function localEncode(contract: Contract, params: any[], method:string) : string {
//   let typeHash = utils.id(generateTypeHash(contract,method));
//   let functionData = contract.interface.encodeFunctionData(method,params);
//   return typeHash.concat(functionData.substring(10));
// }

export async function sign (
  provider: any,
  arcana: Contract,
  forwarder: Contract,
  method: any,
  params: any
): Promise<ContractTransaction> {
  const signer = provider.getSigner()
  const { request, signature } = await signMetaTxRequest(signer, forwarder, arcana, params, {
    from: await signer.getAddress(),
    to: arcana.address,
    method
  })

  request.method = capitalize(method)
  request.data = arcana.interface.encodeFunctionData(method, params).replace('0x', '')
  request.signature = signature.replace('0x', '')
  request.from = request.from.replace('0x', '')
  request.to = request.to.replace('0x', '')
  request.nonce = parseInt(request.nonce)
  return request
}
