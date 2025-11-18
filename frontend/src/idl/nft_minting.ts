export type NftMinting = {
  "version": "0.1.0",
  "name": "nft_minting",
  "instructions": [
    {
      "name": "initializeCollection",
      "accounts": [
        {
          "name": "collectionAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mintNft",
      "accounts": [
        {
          "name": "collectionAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NameTooLong",
      "msg": "The provided name is too long. Maximum length is 32 characters."
    },
    {
      "code": 6001,
      "name": "SymbolTooLong",
      "msg": "The provided symbol is too long. Maximum length is 10 characters."
    },
    {
      "code": 6002,
      "name": "UriTooLong",
      "msg": "The provided URI is too long. Maximum length is 200 characters."
    },
    {
      "code": 6003,
      "name": "CollectionNotInitialized",
      "msg": "Collection authority not initialized. Please initialize first."
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "You are not authorized to mint NFTs for this collection."
    }
  ]
};

export const IDL: NftMinting = {
  "version": "0.1.0",
  "name": "nft_minting",
  "instructions": [
    {
      "name": "initializeCollection",
      "accounts": [
        {
          "name": "collectionAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mintNft",
      "accounts": [
        {
          "name": "collectionAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NameTooLong",
      "msg": "The provided name is too long. Maximum length is 32 characters."
    },
    {
      "code": 6001,
      "name": "SymbolTooLong",
      "msg": "The provided symbol is too long. Maximum length is 10 characters."
    },
    {
      "code": 6002,
      "name": "UriTooLong",
      "msg": "The provided URI is too long. Maximum length is 200 characters."
    },
    {
      "code": 6003,
      "name": "CollectionNotInitialized",
      "msg": "Collection authority not initialized. Please initialize first."
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "You are not authorized to mint NFTs for this collection."
    }
  ]
};
