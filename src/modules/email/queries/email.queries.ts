import { prisma } from "@/services/prisma.service";
import { EmailMessage, EmailCampaign, EmailSubscriber, Prisma } from "@prisma/client";

/**
 * LAYER 4 — EMAIL QUERIES
 * All Database access for the Mailroom module lives here.
 */
export const EmailQueries = {
  // --- INBOX & MESSAGES ---
  async getInboxMessages() {
    return prisma.emailMessage.findMany({
      where: { direction: "INBOUND" },
      orderBy: { createdAt: "desc" },
    });
  },

  async getSentMessages() {
    return prisma.emailMessage.findMany({
      where: { direction: "OUTBOUND" },
      orderBy: { createdAt: "desc" },
    });
  },

  async getMessageThread(threadId: string) {
    return prisma.emailMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
  },

  async saveInboundMessage(data: Omit<Prisma.EmailMessageCreateInput, 'direction'>) {
    return prisma.emailMessage.create({
      data: {
        ...data,
        direction: "INBOUND",
      },
    });
  },

  async saveOutboundMessage(data: Omit<Prisma.EmailMessageCreateInput, 'direction'>) {
    return prisma.emailMessage.create({
      data: {
        ...data,
        direction: "OUTBOUND",
      },
    });
  },

  async updateMessageStatus(id: string, status: any) {
    return prisma.emailMessage.update({
      where: { id },
      data: { status },
    });
  },

  // --- CAMPAIGNS ---
  async getCampaigns() {
    return prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async createCampaign(data: Prisma.EmailCampaignCreateInput) {
    return prisma.emailCampaign.create({
      data,
    });
  },

  async updateCampaign(id: string, data: Prisma.EmailCampaignUpdateInput) {
    return prisma.emailCampaign.update({
      where: { id },
      data,
    });
  },

  // --- SUBSCRIBERS ---
  async getAllSubscribers() {
    return prisma.emailSubscriber.findMany({
      where: { status: "SUBSCRIBED" },
    });
  },

  async addSubscriber(email: string, name?: string) {
    return prisma.emailSubscriber.upsert({
      where: { email },
      update: { status: "SUBSCRIBED", name },
      create: { email, name, status: "SUBSCRIBED" },
    });
  },
};
