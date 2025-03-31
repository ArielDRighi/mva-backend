# Observaciones y Mejoras Recomendadas

## Problema en getContractualConditionById y getContractualConditionsByClient:

- No están devolviendo los resultados encontrados

## Estructura de carpetas:

- El nombre de la carpeta tiene un espacio `condiciones Contractuales`, lo que puede causar problemas.
- Recomiendo renombrarla a `condicionesContractuales`

## Código corregido:

```typescript
async getContractualConditionById(contractualConditionId: number) {
    const contractualCondition = await this.contractualConditionsRepository.findOne({
        where: { condicionContractualId: contractualConditionId },
    });
    if (!contractualCondition) {
        throw new NotFoundException(
            `An error ocurred, Contractual Condition with ID: ${contractualConditionId} not found`,
        );
    }
    return contractualCondition; // Retornar el resultado
}

async getContractualConditionsByClient(clientId: number) {
    const client = await this.clientRepository.findOne({
        where: { clienteId: clientId },
    });
    if (!client) {
        throw new NotFoundException(`Client with ID: ${clientId} not found`);
    }
    const contractualConditions = await this.contractualConditionsRepository.find({
        where: { cliente: client },
    });
    if (!contractualConditions || contractualConditions.length === 0) {
        throw new NotFoundException(
            `The client with ID: ${clientId} not have contractual Conditions`,
        );
    }
    return contractualConditions; // Retornar el resultado
}
```
