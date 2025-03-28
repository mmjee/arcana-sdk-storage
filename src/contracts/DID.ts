export default {
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'previousAdmin',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'newAdmin',
          type: 'address'
        }
      ],
      name: 'AdminChanged',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'beacon',
          type: 'address'
        }
      ],
      name: 'BeaconUpgraded',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          indexed: true,
          internalType: 'uint8',
          name: 'control',
          type: 'uint8'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'app',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'user',
          type: 'address'
        }
      ],
      name: 'FilePermission',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'user',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'nftContract',
          type: 'address'
        }
      ],
      name: 'NFTDownload',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address'
        }
      ],
      name: 'OwnershipTransferred',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'implementation',
          type: 'address'
        }
      ],
      name: 'Upgraded',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: '_factory',
          type: 'address'
        }
      ],
      name: 'setFactory',
      type: 'event'
    },
    {
      inputs: [],
      name: 'APP_ROLE',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          internalType: 'address',
          name: 'newFileOwner',
          type: 'address'
        }
      ],
      name: 'changeFileOwner',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          internalType: 'uint8',
          name: 'control',
          type: 'uint8'
        },
        {
          internalType: 'address',
          name: 'requester',
          type: 'address'
        }
      ],
      name: 'checkPermission',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        },
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'completeUpload',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'deleteFile',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'downloadNFT',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'getFile',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        },
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        },
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        },
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        },
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'getFileOwner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        }
      ],
      name: 'getRuleSet',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'relayer',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'factoryAddress',
          type: 'address'
        }
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'forwarder',
          type: 'address'
        }
      ],
      name: 'isTrustedForwarder',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          internalType: 'address',
          name: 'nftContract',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'chainId',
          type: 'uint256'
        }
      ],
      name: 'linkNFT',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'proxiableUUID',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          internalType: 'address',
          name: 'fileOwner',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'fileSize',
          type: 'uint256'
        },
        {
          internalType: 'bool',
          name: 'uploaded',
          type: 'bool'
        },
        {
          internalType: 'bytes32',
          name: 'name',
          type: 'bytes32'
        },
        {
          internalType: 'bytes32',
          name: 'fileHash',
          type: 'bytes32'
        },
        {
          internalType: 'address',
          name: 'storageNode',
          type: 'address'
        }
      ],
      name: 'setFile',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address'
        }
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'did',
          type: 'bytes32'
        },
        {
          internalType: 'bytes32',
          name: 'ruleHash',
          type: 'bytes32'
        }
      ],
      name: 'updateRuleSet',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newImplementation',
          type: 'address'
        }
      ],
      name: 'upgradeTo',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newImplementation',
          type: 'address'
        },
        {
          internalType: 'bytes',
          name: 'data',
          type: 'bytes'
        }
      ],
      name: 'upgradeToAndCall',
      outputs: [],
      stateMutability: 'payable',
      type: 'function'
    }
  ]
}
