using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Abstractions;
using Infrastructure.Persistence;

namespace Infrastructure.Inbox
{
    public class InboxProcessor : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<InboxProcessor> _logger;

        public InboxProcessor(IServiceProvider serviceProvider, ILogger<InboxProcessor> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var catalogContext = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
                    
                    // Fetch all tenants to process inbox in each tenant's database instance
                    var tenants = await catalogContext.Tenants.ToListAsync(stoppingToken);

                    foreach (var tenant in tenants)
                    {
                        var tenantProvider = scope.ServiceProvider.GetRequiredService<ICurrentTenantProvider>();
                        tenantProvider.SetTenantId(tenant.TenantId);

                        var applicationContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                        var messages = await applicationContext.Set<InboxMessage>()
                            .Where(m => m.ProcessedOnUtc == null)
                            .OrderBy(m => m.OccurredOnUtc)
                            .Take(20)
                            .ToListAsync(stoppingToken);

                        foreach (var message in messages)
                        {
                            try
                            {
                                // In a microservices ecosystem, we would deserialize to the corresponding integration event
                                // here, we'll mimic publishing it to MediatR handlers.
                                var integrationEvent = JsonConvert.DeserializeObject<INotification>(message.Content, new JsonSerializerSettings
                                {
                                    TypeNameHandling = TypeNameHandling.All
                                });

                                if (integrationEvent != null)
                                {
                                    await mediator.Publish(integrationEvent, stoppingToken);
                                }

                                message.ProcessedOnUtc = DateTime.UtcNow;
                            }
                            catch (Exception ex)
                            {
                                message.Error = ex.ToString();
                                _logger.LogError(ex, "Failed to process inbox message {MessageId}", message.Id);
                            }
                        }

                        if (messages.Any())
                        {
                            await applicationContext.SaveChangesAsync(stoppingToken);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing inbox messages.");
                }

                await Task.Delay(5000, stoppingToken); // Check every 5 seconds
            }
        }
    }
}
