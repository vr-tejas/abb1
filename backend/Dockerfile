FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["IntelliInspect.Api.csproj", "."]
RUN dotnet restore "./IntelliInspect.Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "IntelliInspect.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IntelliInspect.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p uploads

ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "IntelliInspect.Api.dll"]
