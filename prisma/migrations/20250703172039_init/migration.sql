-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pterodactylServerId" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "ram" INTEGER NOT NULL,
    "cores" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slackId_key" ON "User"("slackId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_pterodactylServerId_key" ON "Server"("pterodactylServerId");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
