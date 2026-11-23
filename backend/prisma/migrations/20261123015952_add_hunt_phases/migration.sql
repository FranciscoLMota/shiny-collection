-- CreateTable
CREATE TABLE "HuntPhase" (
    "id" SERIAL NOT NULL,
    "huntId" INTEGER NOT NULL,
    "dexEntryId" INTEGER NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "encounters" INTEGER NOT NULL,
    "totalEncounters" INTEGER NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "ownedPokemonId" INTEGER,

    CONSTRAINT "HuntPhase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HuntPhase_ownedPokemonId_key" ON "HuntPhase"("ownedPokemonId");

-- CreateIndex
CREATE INDEX "HuntPhase_dexEntryId_idx" ON "HuntPhase"("dexEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "HuntPhase_huntId_phaseNumber_key" ON "HuntPhase"("huntId", "phaseNumber");

-- AddForeignKey
ALTER TABLE "HuntPhase" ADD CONSTRAINT "HuntPhase_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntPhase" ADD CONSTRAINT "HuntPhase_dexEntryId_fkey" FOREIGN KEY ("dexEntryId") REFERENCES "DexEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntPhase" ADD CONSTRAINT "HuntPhase_ownedPokemonId_fkey" FOREIGN KEY ("ownedPokemonId") REFERENCES "OwnedPokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
