terraform {
  required_version = ">=1.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~>3.0"
    }

    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4.0"
    }

    time = {
      source  = "hashicorp/time"
      version = "~>0.9.1"
    }

    azapi = {
      source  = "azure/azapi"
      version = "~>2.0"
    }
  }
}

provider "azurerm" {
  features {

  }
}
